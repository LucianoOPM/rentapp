# 005 — Better Auth con usuario y contraseña

**Estado:** aceptada (26 nov 2026)

**Decisión en breve:** Better Auth con usuario y contraseña

**Descartado:** Supabase Auth, código por correo, SMS

- **Decisión:** el inquilino entra con usuario y contraseña (plugin username), sin dar correo, y hay dos roles: `admin` y `renter`. No hay registro abierto: solo la administradora da de alta inquilinos.
- **Alternativas:** pedir el correo puede generar desconfianza en los inquilinos, y los SMS cuestan por mensaje.
- **Consecuencias:** no hay recuperación automática, así que la administradora restablece las contraseñas desde su panel. Como no hay correo verificado, el contrato incluye una cláusula en la que el inquilino reconoce su cuenta.
