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


"""Stone Invoice Parser"""

_MONTHS_PT = {
    "jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
    "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12,
}


class StoneParser(BaseParser):
    BANK_NAME = "Stone"

    def detect(self, text: str) -> bool:
        return bool(re.search(
            r"\bstone\b|stonecash|stone\s+pagamentos|conta\s+stone|cartao\s+stone|cartão\s+stone",
            text, re.IGNORECASE,
        ))

    def parse(self, text: str) -> List[ParsedTransaction]:
        transactions = []
        lines = text.splitlines()

        # Pattern 1 — DD/MM or DD/MM/YYYY  description  [XX/YY]  amount
        pat_ddmm = re.compile(
            r"(\d{2}/\d{2}(?:/\d{2,4})?)\s+"
            r"(.+?)\s+"
            r"(?:(\d{2}/\d{2,3})\s+)?"
            r"([\d.,]+)\s*$"
        )

        # Pattern 2 — DD MMM  description  [XX/YY]  amount  (e.g. "05 mai")
        pat_ddmon = re.compile(
            r"(\d{2})\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s+"
            r"(.+?)\s+"
            r"(?:(\d{2}/\d{2,3})\s+)?"
            r"([\d.,]+)\s*$",
            re.IGNORECASE,
        )

        skip = re.compile(
            r"total|limite|saldo|pagamento|vencimento|fatura|encargo|juros|multa"
            r"|crédito|débito|extrato|stone\s*co|anuidade",
            re.IGNORECASE,
        )

        from datetime import date as Date

        for line in lines:
            line = line.strip()
            if not line or skip.search(line):
                continue

            # Try DD/MM pattern first
            m = pat_ddmm.match(line)
            if m:
                tx_date = self.parse_date_br(m.group(1))
                desc    = m.group(2).strip()
                amount  = self.parse_amount(m.group(4))
                inst_cur, inst_tot = self.parse_installment(m.group(3) or "")
                if tx_date and amount and 0 < amount <= 50000:
                    transactions.append(ParsedTransaction(
                        date=tx_date, description=desc, amount=amount,
                        installment_current=inst_cur, installment_total=inst_tot,
                    ))
                continue

            # Try DD MMM pattern
            m = pat_ddmon.match(line)
            if m:
                day = int(m.group(1))
                mon = _MONTHS_PT.get(m.group(2).lower(), 0)
                if not mon:
                    continue
                try:
                    tx_date = Date(Date.today().year, mon, day)
                except ValueError:
                    continue
                desc    = m.group(3).strip()
                amount  = self.parse_amount(m.group(5))
                inst_cur, inst_tot = self.parse_installment(m.group(4) or "")
                if amount and 0 < amount <= 50000:
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
