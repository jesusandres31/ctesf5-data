# querys

- Field Operations

1. Daily Field Activity

```sql
SELECT
    DATE(jj.inicio_jornada) AS fecha,
    uu.nombre AS ubicacion,
    COUNT(jj.id) AS num_jornadas,
    COUNT(DISTINCT jj.canchero_id) AS num_cancheros,
    COUNT(ja.id) AS num_alquileres,
    SUM(ja.monto_alquiler) AS total_alquileres,
    COUNT(jv.id) AS num_ventas,
    SUM(jv.precio_total) AS total_ventas
FROM jornada_jornada jj
LEFT JOIN ubicacion_ubicacion uu ON jj.ubicacion_id = uu.id
LEFT JOIN jornada_alquiler ja ON ja.jornada_id = jj.id
LEFT JOIN jornada_venta jv ON jv.jornada_id = jj.id
GROUP BY DATE(jj.inicio_jornada), uu.nombre
ORDER BY fecha DESC;
```

2. Top Products by Location

```sql
SELECT
    uu.nombre AS ubicacion,
    cp.nombre AS producto,
    SUM(jv.cantidad) AS cantidad_vendida,
    SUM(jv.precio_total) AS total_ventas
FROM jornada_venta jv
JOIN cantina_productocantina cpc ON jv.producto_id = cpc.id
JOIN cantina_producto cp ON cpc.producto_id = cp.id
JOIN jornada_jornada jj ON jv.jornada_id = jj.id
JOIN ubicacion_ubicacion uu ON jj.ubicacion_id = uu.id
GROUP BY uu.nombre, cp.nombre
ORDER BY total_ventas DESC
LIMIT 20;
```

3. Task Completion Rate by Location

```sql
SELECT
    uu.nombre AS ubicacion,
    tt.nombre AS tarea,
    COUNT(tr.id) AS veces_realizada,
    SUM(CASE WHEN tr.hecha THEN 1 ELSE 0 END) AS veces_completada,
    ROUND((SUM(CASE WHEN tr.hecha THEN 1 ELSE 0 END)::numeric / COUNT(tr.id)::numeric) * 100, 2) AS porcentaje_completado
FROM jornada_tarearealizada tr
JOIN tareas_tarea tt ON tr.tarea_id = tt.id
JOIN ubicacion_ubicacion uu ON tr.ubicacion_id = uu.id
GROUP BY uu.nombre, tt.nombre
ORDER BY porcentaje_completado DESC;
```

- Financial Analysis

4. Monthly Income vs Expenses

```sql
SELECT
    TO_CHAR(fi.fecha, 'YYYY-MM') AS mes,
    uu.nombre AS ubicacion,
    SUM(fi.monto_efectivo + fi.monto_transferencia) AS ingresos,
    SUM(fg.monto_efectivo + fg.monto_transferencia) AS gastos,
    SUM(fi.monto_efectivo + fi.monto_transferencia) - SUM(fg.monto_efectivo + fg.monto_transferencia) AS balance
FROM finanzas_ingreso fi
JOIN ubicacion_ubicacion uu ON fi.ubicacion_id = uu.id
LEFT JOIN finanzas_gasto fg ON fg.ubicacion_id = uu.id AND TO_CHAR(fi.fecha, 'YYYY-MM') = TO_CHAR(fg.fecha, 'YYYY-MM')
GROUP BY TO_CHAR(fi.fecha, 'YYYY-MM'), uu.nombre
ORDER BY mes DESC, ubicacion;
```

5. Expenses by Category

```sql
SELECT
    fc.nombre AS categoria,
    ft.nombre AS tipo_gasto,
    SUM(fg.monto_efectivo + fg.monto_transferencia) AS total_gasto
FROM finanzas_gasto fg
JOIN finanzas_categoria fc ON fg.categoria_id = fc.id
JOIN finanzas_tipogasto ft ON fg.tipo_id = ft.id
GROUP BY fc.nombre, ft.nombre
ORDER BY total_gasto DESC;
```

6. Cash Flow Trend

```sql
SELECT
    fecha,
    SUM(saldo) AS saldo_total
FROM finanzas_saldodiario
GROUP BY fecha
ORDER BY fecha;
```

- Reservations & Bookings

7. Court Occupancy Rate

```sql
SELECT
    cc.nombre AS cancha,
    uu.nombre AS ubicacion,
    COUNT(ja.id) AS alquileres,
    SUM(EXTRACT(EPOCH FROM (ja.fecha_hora_fin - ja.fecha_hora_inicio)) / 3600) AS horas_ocupadas,
    ROUND(SUM(ja.monto_alquiler), 2) AS ingresos_totales
FROM canchas_cancha cc
JOIN ubicacion_ubicacion uu ON cc.ubicacion_id = uu.id
LEFT JOIN (
    SELECT
        a.id,
        a.cancha_id,
        a.fecha_hora_inicio,
        a.fecha_hora_inicio + INTERVAL '1 hour' * 1.5 AS fecha_hora_fin,
        a.monto_alquiler
    FROM jornada_alquiler a
) ja ON cc.id = ja.cancha_id
GROUP BY cc.nombre, uu.nombre
ORDER BY horas_ocupadas DESC;
```

8. Fixed vs. Eventual Reservations

```sql
SELECT
    uu.nombre AS ubicacion,
    cc.nombre AS cancha,
    COUNT(DISTINCT rr.id) AS reservas_fijas,
    COUNT(DISTINCT re.id) AS reservas_eventuales
FROM ubicacion_ubicacion uu
JOIN canchas_cancha cc ON cc.ubicacion_id = uu.id
LEFT JOIN reservas_reservafija rr ON rr.cancha_id = cc.id
LEFT JOIN reservas_reservaeventual re ON re.cancha_id = cc.id
GROUP BY uu.nombre, cc.nombre;
```

9. Weekly Reservation Pattern

```sql
SELECT
    rr.dia_semana,
    CASE
        WHEN rr.dia_semana = 0 THEN 'Lunes'
        WHEN rr.dia_semana = 1 THEN 'Martes'
        WHEN rr.dia_semana = 2 THEN 'Miércoles'
        WHEN rr.dia_semana = 3 THEN 'Jueves'
        WHEN rr.dia_semana = 4 THEN 'Viernes'
        WHEN rr.dia_semana = 5 THEN 'Sábado'
        WHEN rr.dia_semana = 6 THEN 'Domingo'
    END AS nombre_dia,
    COUNT(*) AS num_reservas_fijas
FROM reservas_reservafija rr
GROUP BY rr.dia_semana
ORDER BY rr.dia_semana;
```

- Inventory Management

10. Product Stock Level

```sql
SELECT
    cc.nombre AS cantina,
    cp.nombre AS producto,
    cpc.cantidad_en_stock AS stock_actual,
    cp.stock_minimo AS stock_minimo,
    CASE WHEN cpc.cantidad_en_stock <= cp.stock_minimo THEN 'Bajo stock' ELSE 'Stock OK' END AS estado_stock
FROM cantina_productocantina cpc
JOIN cantina_cantina cc ON cpc.cantina_id = cc.id
JOIN cantina_producto cp ON cpc.producto_id = cp.id
ORDER BY estado_stock, cc.nombre, cp.nombre;
```

11. Product Sales by Category

```sql
SELECT
    ctp.nombre AS tipo_producto,
    cp.nombre AS producto,
    SUM(jv.cantidad) AS unidades_vendidas,
    SUM(jv.precio_total) AS total_ventas
FROM jornada_venta jv
JOIN cantina_productocantina cpc ON jv.producto_id = cpc.id
JOIN cantina_producto cp ON cpc.producto_id = cp.id
JOIN cantina_tipoproducto ctp ON cp.tipo_id = ctp.id
GROUP BY ctp.nombre, cp.nombre
ORDER BY ctp.nombre, unidades_vendidas DESC;
```
