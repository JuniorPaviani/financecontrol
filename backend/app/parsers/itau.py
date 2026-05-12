"""
Itaú Invoice Parser
Handles Itaú credit card PDF statements.

Typical Itaú line format:
  DD/MM  DESCRIÇÃO DA COMPRA  [XX/YY]  1.234,56
"""
import re
from datetime import date
from typing import List

from app.parsers.base import BaseParser, ParsedTransaction


class ItauParser(BaseParser):
    BANK_NAME = "Itaú"

    def detect(self, text: str) -> bool:
        return bool(re.search(r"itau|itaú|banco itaú", text, re.IGNORECASE))

    def parse(self, text: str) -> List[ParsedTransaction]:
        transactions = []
        lines = text.splitlines()

        # Pattern: DD/MM  <description>  [XX/YY]  value
        pattern = re.compile(
            r"(\d{2}/\d{2})\s+"          # date
            r"(.+?)\s+"                   # description (non-greedy)
            r"(?:(\d{2}/\d{2,3})\s+)?"   # optional installment
            r"([\d.,]+)\s*$"              # amount at end of line
        )

        for line in lines:
            line = line.strip()
            # Skip header/footer lines
            if re.search(r"total|saldo|limite|vencimento|pagamento|fatura", line, re.IGNORECASE):
                continue

            m = pattern.match(line)
            if not m:
                continue

            tx_date = self.parse_date_br(m.group(1))
            desc    = m.group(2).strip()
            inst_str= m.group(3)
            amount  = self.parse_amount(m.group(4))

            if not tx_date or not amount or amount <= 0:
                continue
            if amount > 50000:          # sanity check
                continue

            inst_cur, inst_tot = (None, None)
            if inst_str:
                inst_cur, inst_tot = self.parse_installment(inst_str)

            transactions.append(ParsedTransaction(
                date=tx_date,
                description=desc,
                amount=amount,
                installment_current=inst_cur,
                installment_total=inst_tot,
            ))

        return transactions
