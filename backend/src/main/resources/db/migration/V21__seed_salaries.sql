INSERT INTO salaries (
    employee_id,
    basic_salary,
    allowances,
    deductions,
    net_salary,
    effective_from,
    effective_to,
    currency,
    change_reason,
    created_at,
    updated_at,
    is_deleted
)
SELECT
    p.employee_id,
    p.basic_salary,
    COALESCE(p.allowances, 0)           AS allowances,
    COALESCE(p.insurance_deduction, 0)  AS deductions,
    COALESCE(p.net_pay, p.basic_salary) AS net_salary,
    -- Effective from đầu năm 2024 (hoặc ngày thuê nếu muốn chính xác hơn)
    '2024-01-01'                        AS effective_from,
    NULL                                AS effective_to,      -- NULL = hiện tại
    'VND',
    'Seed từ dữ liệu payroll hiện có',
    NOW(),
    NOW(),
    0
FROM (
    SELECT
        p1.employee_id,
        p1.basic_salary,
        p1.allowances,
        p1.insurance_deduction,
        p1.net_pay
    FROM payrolls p1
    INNER JOIN (
        SELECT employee_id,
               MAX(payroll_year * 100 + payroll_month) AS max_period
        FROM payrolls
        GROUP BY employee_id
    ) latest ON p1.employee_id = latest.employee_id
             AND (p1.payroll_year * 100 + p1.payroll_month) = latest.max_period
) p

WHERE p.employee_id IN (
    SELECT e.id FROM employees e WHERE e.status = 'ACTIVE'
)
AND p.employee_id NOT IN (
    SELECT DISTINCT s.employee_id FROM salaries s
    WHERE s.effective_from <= CURDATE()
      AND (s.effective_to IS NULL OR s.effective_to >= CURDATE())
      AND s.is_deleted = 0
);

SELECT
    e.id,
    CONCAT(e.first_name, ' ', e.last_name) AS ten_nhan_vien,
    s.basic_salary,
    s.allowances,
    s.effective_from,
    s.effective_to
FROM employees e
LEFT JOIN salaries s ON s.employee_id = e.id
    AND s.effective_from <= CURDATE()
    AND (s.effective_to IS NULL OR s.effective_to >= CURDATE())
    AND s.is_deleted = 0
WHERE e.status = 'ACTIVE'
ORDER BY e.id;
