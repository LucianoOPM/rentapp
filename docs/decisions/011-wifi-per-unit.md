# 011 — WiFi por departamento con contraseña manual

**Estado:** aceptada (26 nov 2026)

**Decisión en breve:** WiFi: una red por departamento con contraseña manual

**Descartado:** Portal cautivo, API de Omada, QR en la plataforma

- **Contexto:** hay 3 departamentos en la misma casa, y el proveedor permite compartir el servicio.
- **Decisión:** equipo TP-Link Omada con una red aislada (VLAN) y velocidad limitada para cada departamento, separada de la red de la casa. La administradora cambia la contraseña en la app de Omada y la escribe en la plataforma. Se usan contraseñas fáciles de escribir, como `Luna-Verde-4827`.
- **Alternativas:** el portal cautivo es incómodo para estancias largas. La API de Omada no se justifica para unos cuantos cambios al año. El QR dentro de la plataforma sobra, porque Android y iPhone ya comparten la red con QR desde sus ajustes.
