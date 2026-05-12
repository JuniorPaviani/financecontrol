"""
Caixa Econômica Federal Invoice Parser
Handles Caixa credit card PDF statements.

Typical Caixa line formats:
  DD/MM/AAAA  DESCRIÇÃO  Parcela XX/YY  1.234,56
  DD/MM  DESCRIÇÃO  1.234,56
"""
import re
from typing import List
from app.parsers.base import BaseParser, ParsedTransaction


class CaixaParser(BaseParser):
    BANK_NAME = "Caixa"

    def detect(self, text: str) -> bool:
        return bool(re.search(
            r"caixa\s+econ[oô]mica|caixa\s+federal|CAIXA|cef\b",
            text, re.IGNORECASE
        ))

    def parse(self, text: str) -> List[ParsedTransaction]:
        transactions = []
        lines = text.splitlines()

        # Pattern 1: DD/MM/AAAA  description  [parcela XX/YY]  value
        pattern_full = re.compile(
            r"(\d{2}/\d{2}/\d{4})\s+"
            r"(.+?)\s+"
            r"(?:(?:Parc(?:ela)?\.?\s*)?(\d{2}/\d{2,3})\s+)?"
            r"([\d.,]+)\s*$"
        )

        # Pattern 2: DD/MM  description  [XX/YY]  value
        pattern_short = re.compile(
            r"(\d{2}/\d{2})\s+"
            r"(.+?)\s+"
            r"(?:(\d{2}/\d{2,3})\s+)?"
            r"([\d.,]+)\s*$"
        )

        for line in lines:
            line = line.strip()
            if re.search(
                r"total|limite|saldo|pagamento|vencimento|fatura|encargos|anterior",
                line, re.IGNORECASE
            ):
                continue

            m = pattern_full.match(line) or pattern_short.match(line)
            if not m:
                continue

            tx_date = self.parse_date_br(m.group(1))
            desc = m.group(2).strip()
            amount = self.parse_amount(m.group(4))

            if not tx_date or not amount or amount <= 0 or amount > 50000:
                continue

            inst_cur, inst_tot = self.parse_installment(m.group(3) or "")

            transactions.append(ParsedTransaction(
                date=tx_date,
                description=desc,
                amount=amount,
                installment_current=inst_cur,
                installment_total=inst_tot,
            ))

        return transactions
