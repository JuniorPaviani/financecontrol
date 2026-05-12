"""
Santander Invoice Parser
"""
import re
from typing import List
from app.parsers.base import BaseParser, ParsedTransaction


class SantanderParser(BaseParser):
    BANK_NAME = "Santander"

    def detect(self, text: str) -> bool:
        return bool(re.search(r"santander", text, re.IGNORECASE))

    def parse(self, text: str) -> List[ParsedTransaction]:
        transactions = []
        lines = text.splitlines()
        # Santander format: DD/MM/AAAA  Descrição  Parcela  Valor
        pattern = re.compile(
            r"(\d{2}/\d{2}/\d{4})\s+"   # full date
            r"(.+?)\s+"
            r"(?:Parc\.?\s*(\d{2}/\d{2,3})\s+)?"
            r"([\d.,]+)\s*$"
        )
        for line in lines:
            line = line.strip()
            if re.search(r"total|limite|fatura|pagamento|vencimento", line, re.IGNORECASE):
                continue
            m = pattern.match(line)
            if not m:
                continue
            tx_date = self.parse_date_br(m.group(1))
            desc    = m.group(2).strip()
            amount  = self.parse_amount(m.group(4))
            if not tx_date or not amount or amount <= 0 or amount > 50000:
                continue
            inst_cur, inst_tot = self.parse_installment(m.group(3) or "")
            transactions.append(ParsedTransaction(
                date=tx_date, description=desc, amount=amount,
                installment_current=inst_cur, installment_total=inst_tot,
            ))
        return transactions
