from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter()


@router.get("/", response_model=List[schemas.EmployeeOut])
def list_employees(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    return db.query(models.Employee).filter(models.Employee.user_id == current_user.id).order_by(models.Employee.name).all()


@router.post("/", response_model=schemas.EmployeeOut, status_code=201)
def create_employee(
    payload: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    emp = models.Employee(**payload.model_dump(), user_id=current_user.id)
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.put("/{emp_id}", response_model=schemas.EmployeeOut)
def update_employee(
    emp_id: int,
    payload: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    emp = db.query(models.Employee).filter(
        models.Employee.id == emp_id,
        models.Employee.user_id == current_user.id
    ).first()
    if not emp:
        raise HTTPException(404, "Funcionário não encontrado")
    for k, v in payload.model_dump().items():
        setattr(emp, k, v)
    db.commit()
    db.refresh(emp)
    return emp


@router.delete("/{emp_id}", status_code=204)
def delete_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    emp = db.query(models.Employee).filter(
        models.Employee.id == emp_id,
        models.Employee.user_id == current_user.id
    ).first()
    if not emp:
        raise HTTPException(404, "Funcionário não encontrado")
    db.delete(emp)
    db.commit()


@router.get("/{emp_id}/salaries", response_model=List[schemas.SalaryPaymentOut])
def list_salaries(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    emp = db.query(models.Employee).filter(
        models.Employee.id == emp_id,
        models.Employee.user_id == current_user.id
    ).first()
    if not emp:
        raise HTTPException(404, "Funcionário não encontrado")
    return db.query(models.SalaryPayment).filter(
        models.SalaryPayment.employee_id == emp_id,
        models.SalaryPayment.user_id == current_user.id
    ).order_by(models.SalaryPayment.periodo_referencia.desc()).all()


@router.post("/{emp_id}/salaries", response_model=schemas.SalaryPaymentOut, status_code=201)
def create_salary(
    emp_id: int,
    payload: schemas.SalaryPaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    emp = db.query(models.Employee).filter(
        models.Employee.id == emp_id,
        models.Employee.user_id == current_user.id
    ).first()
    if not emp:
        raise HTTPException(404, "Funcionário não encontrado")
    sp = models.SalaryPayment(**payload.model_dump(), employee_id=emp_id, user_id=current_user.id)
    db.add(sp)
    db.commit()
    db.refresh(sp)
    return sp


@router.put("/{emp_id}/salaries/{salary_id}", response_model=schemas.SalaryPaymentOut)
def update_salary(
    emp_id: int,
    salary_id: int,
    payload: schemas.SalaryPaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    sp = db.query(models.SalaryPayment).filter(
        models.SalaryPayment.id == salary_id,
        models.SalaryPayment.employee_id == emp_id,
        models.SalaryPayment.user_id == current_user.id
    ).first()
    if not sp:
        raise HTTPException(404, "Pagamento não encontrado")
    for k, v in payload.model_dump().items():
        setattr(sp, k, v)
    db.commit()
    db.refresh(sp)
    return sp


@router.delete("/{emp_id}/salaries/{salary_id}", status_code=204)
def delete_salary(
    emp_id: int,
    salary_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    sp = db.query(models.SalaryPayment).filter(
        models.SalaryPayment.id == salary_id,
        models.SalaryPayment.employee_id == emp_id,
        models.SalaryPayment.user_id == current_user.id
    ).first()
    if not sp:
        raise HTTPException(404, "Pagamento não encontrado")
    db.delete(sp)
    db.commit()
