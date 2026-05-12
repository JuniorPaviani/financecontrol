"""Bradesco Invoice Parser"""
import re
from typing import List
from app.parsers.base import BaseParser, ParsedTransaction


class BradescoParser(BaseParser):
    BANK_NAME = "Bradesco"

    def detect(self, text: str) -> bool:
        return bool(re.search(r"bradesco", text, re.IGNORECASE))

    def parse(self, text: str) -> List[ParsedTransaction]:
        transactions = []
        lines = text.splitlines()
        # Bradesco: DD/MM  Descrição  XX/YY  R$ 1.234,56
        pattern = re.compile(
            r"(\d{2}/\d{2})\s+"
            r"(.+?)\s+"
            r"(?:(\d{2}/\d{2,3})\s+)?"
            r"R?\$?\s*([\d.,]+)\s*$"
        )
        for line in lines:
            line = line.strip()
            if re.search(r"total|limite|vencimento|pagamento|saldo", line, re.IGNORECASE):
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
