"""Sam's Club Invoice Parser"""
import re
from typing import List
from app.parsers.base import BaseParser, ParsedTransaction


class SamsClubParser(BaseParser):
    BANK_NAME = "Sam's Club"

    def detect(self, text: str) -> bool:
        return bool(re.search(r"sam.?s\s*club|samsclub", text, re.IGNORECASE))

    def parse(self, text: str) -> List[ParsedTransaction]:
        transactions = []
        lines = text.splitlines()
        pattern = re.compile(
            r"(\d{2}/\d{2}(?:/\d{2,4})?)\s+"
            r"(.+?)\s+"
            r"(?:(\d{2}/\d{2,3})\s+)?"
            r"([\d.,]+)\s*$"
        )
        for line in lines:
            line = line.strip()
            if re.search(r"total|limite|fatura|saldo|pagamento", line, re.IGNORECASE):
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


"""Sicredi Invoice Parser"""


class SicrediParser(BaseParser):
    BANK_NAME = "Sicredi"

    def detect(self, text: str) -> bool:
        return bool(re.search(r"sicredi|cooperativa\s+de\s+crédito", text, re.IGNORECASE))

    def parse(self, text: str) -> List[ParsedTransaction]:
        transactions = []
        lines = text.splitlines()
        # Sicredi uses DD/MM/AAAA with full year
        pattern = re.compile(
            r"(\d{2}/\d{2}/\d{4})\s+"
            r"(.+?)\s+"
            r"(?:(\d{2}/\d{2,3})\s+)?"
            r"([\d.,]+)\s*$"
        )
        for line in lines:
            line = line.strip()
            if re.search(r"total|limite|saldo|pagamento|vencimento", line, re.IGNORECASE):
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


"""Riachuelo Invoice Parser"""


class RiachueloParser(BaseParser):
    BANK_NAME = "Riachuelo"

    def detect(self, text: str) -> bool:
        return bool(re.search(r"riachuelo|midway", text, re.IGNORECASE))

    def parse(self, text: str) -> List[ParsedTransaction]:
        transactions = []
        lines = text.splitlines()
        # Riachuelo format similar to Santander (Midway bank)
        pattern = re.compile(
            r"(\d{2}/\d{2}(?:/\d{2,4})?)\s+"
            r"(.+?)\s+"
            r"(?:(\d{2}/\d{2,3})\s+)?"
            r"([\d.,]+)\s*$"
        )
        for line in lines:
            line = line.strip()
            if re.search(r"total|limite|saldo|pagamento|vencimento|fatura", line, re.IGNORECASE):
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
