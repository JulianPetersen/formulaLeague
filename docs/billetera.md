# Funcionalidad de billetera

Este documento explica como quedo implementada la billetera de Formula League, incluyendo el circuito de negocio, backend y frontend.

## Objetivo

La billetera permite que un usuario acumule saldo real cuando gana premios. Antes la pantalla calculaba el saldo directamente desde el premio activo/cerrado. Ahora el premio se deposita en una billetera persistida del usuario, por lo que puede acumular varios premios a lo largo del tiempo.

## Circuito completo

1. Se crea un premio de temporada en `Prize`.
2. Mientras el premio esta `activo`, se muestra como pozo de temporada.
3. Los usuarios suman puntos durante la temporada.
4. Cuando el premio se cambia a `cerrado`, el backend busca automaticamente el usuario con mas `points`.
5. El ganador queda guardado en `Prize.winner`.
6. El monto del premio se deposita en la billetera del ganador.
7. Se registra una transaccion `prize_credit`.
8. Se guarda un `SeasonResult` con el snapshot del ranking final.
9. Se reinician los puntos de todos los usuarios a `0`.
10. El usuario puede entrar a su billetera y solicitar el cobro del saldo disponible.
11. Al solicitar cobro, el saldo disponible pasa a saldo en revision.
12. Administracion aprueba, paga o rechaza la solicitud.
13. Si se paga, queda registrado como `paid` y aumenta `totalPaid`.
14. Si se rechaza, el dinero vuelve al saldo disponible.

## Backend

### Modelos principales

#### `Prize`

Representa el premio de temporada.

Campos relevantes:

```js
amount
winner
endDate
status
participants
```

Estados:

```txt
proximamente
activo
cerrado
```

Cuando un premio pasa a `cerrado`, el backend asigna automaticamente el ganador si todavia no tiene uno.

#### `Wallet`

Representa la billetera real del usuario.

Campos:

```js
user
currency
balance
pendingBalance
totalEarned
totalPaid
```

Significado:

- `balance`: saldo disponible para solicitar cobro.
- `pendingBalance`: saldo reservado en una solicitud pendiente/aprobada.
- `totalEarned`: total historico ganado por premios.
- `totalPaid`: total historico pagado.

#### `WalletTransaction`

Guarda el historial de movimientos de la billetera.

Tipos actuales:

```txt
prize_credit
claim_hold
claim_release
claim_paid
adjustment
```

Ejemplos:

- `prize_credit`: se acredita un premio ganado.
- `claim_hold`: se reserva saldo para una solicitud de cobro.
- `claim_release`: se libera saldo por solicitud rechazada.
- `claim_paid`: se marca un cobro como pagado.

#### `WalletClaim`

Representa una solicitud de cobro.

Campos relevantes:

```js
user
wallet
prize
amount
currency
status
method
accountAlias
note
requestedAt
approvedAt
paidAt
rejectedReason
```

Estados:

```txt
pending
approved
paid
rejected
```

#### `SeasonResult`

Guarda el cierre historico de una temporada.

Campos relevantes:

```js
prize
winner
winnerPoints
rankingSnapshot
closedAt
pointsResetAt
```

`rankingSnapshot` conserva la tabla de usuarios y puntos antes del reset.

Cada `SeasonResult` esta asociado a un unico `Prize`, para evitar cerrar y resetear dos veces la misma temporada.

### Cierre automatico del premio

El cierre se maneja en `src/controllers/prize.controller.js`.

Cuando se recibe:

```json
{
  "status": "cerrado"
}
```

el backend:

1. Busca el premio.
2. Si no tiene `winner`, busca el usuario con mas puntos:

```js
User.findOne().sort({ points: -1, createdAt: 1 })
```

3. Guarda ese usuario en `prize.winner`.
4. Guarda el premio.
5. Deposita el monto en la billetera del ganador con `depositPrizeToWinner`.
6. Crea el resultado de temporada con `closeSeasonForPrize`.
7. Reinicia `User.points` a `0` para todos los usuarios.

El deposito es idempotente: no deberia acreditar dos veces el mismo premio, porque se registra una transaccion unica de tipo `prize_credit` asociada al `Prize`.

El cierre de temporada tambien es idempotente: si ya existe un `SeasonResult` para ese premio, no vuelve a crear el snapshot ni a resetear puntos. Si el snapshot existe pero `pointsResetAt` quedo vacio por algun fallo intermedio, completa el reset.

### Normalizacion de montos

El premio puede venir como string, por ejemplo:

```txt
1.000.000
```

El backend normaliza ese valor a numero:

```js
1000000
```

Esto evita que JavaScript interprete `"1.000.000"` como `1`.

### Endpoints de wallet

#### `GET /api/wallet`

Devuelve el resumen de la billetera del usuario autenticado.

Respuesta esperada:

```json
{
  "season": "2026",
  "currency": "USD",
  "accumulatedPrize": 1000000,
  "availableBalance": 1000000,
  "pendingBalance": 0,
  "totalPaid": 0,
  "prizeStatus": "cerrado",
  "isWinner": true,
  "canClaim": true,
  "claim": null,
  "updatedAt": "2026-06-30T00:00:00.000Z"
}
```

Notas:

- `accumulatedPrize` equivale a `Wallet.totalEarned`.
- `availableBalance` equivale a `Wallet.balance`.
- `pendingBalance` equivale a `Wallet.pendingBalance`.
- `totalPaid` equivale a `Wallet.totalPaid`.

#### `POST /api/wallet/claim`

Crea una solicitud de cobro por todo el saldo disponible.

Body:

```json
{
  "method": "mercado_pago",
  "accountAlias": "alias.del.usuario",
  "note": "Nota opcional"
}
```

Al crear la solicitud:

1. Se valida que el usuario tenga `balance > 0`.
2. Se valida que no tenga otra solicitud `pending` o `approved`.
3. Se crea un `WalletClaim`.
4. Se mueve el monto desde `balance` hacia `pendingBalance`.
5. Se crea una transaccion `claim_hold`.

#### `GET /api/wallet/claims`

Endpoint administrativo para listar solicitudes de cobro.

Requiere rol:

```txt
admin
moderator
```

Opcionalmente permite filtrar por status:

```http
GET /api/wallet/claims?status=pending
```

#### `PATCH /api/wallet/claims/:id`

Endpoint administrativo para cambiar el estado de una solicitud.

Body:

```json
{
  "status": "paid"
}
```

Estados permitidos:

```txt
pending
approved
paid
rejected
```

Comportamiento:

- `approved`: marca la solicitud como aprobada.
- `paid`: descuenta el saldo en revision y suma a `totalPaid`.
- `rejected`: devuelve el dinero desde `pendingBalance` a `balance`.

## Frontend

La pantalla esta en:

```txt
src/app/pages/wallet/
```

El servicio esta en:

```txt
src/app/services/wallet-service.ts
```

El modelo esta en:

```txt
src/app/models/wallet.ts
```

### Modelo del frontend

`WalletSummary` ahora incluye:

```ts
season: string;
currency: string;
accumulatedPrize: number;
availableBalance: number;
pendingBalance: number;
totalPaid: number;
prizeStatus: string;
isWinner: boolean;
canClaim: boolean;
claim?: WalletClaim;
updatedAt?: string | Date;
```

`WalletClaim` incluye:

```ts
status
method
accountAlias
note
amount
currency
requestedAt
approvedAt
paidAt
rejectedReason
```

### Pantalla de billetera

La pantalla ahora representa una billetera real, no solo el estado de un premio.

Muestra:

- Saldo disponible.
- Total ganado.
- Saldo en revision.
- Total pagado.
- Estado de la ultima solicitud.

Si `wallet.canClaim` es `true`, se muestra el formulario de cobro.

Si `wallet.canClaim` es `false`, se muestra un mensaje segun el estado:

- Sin saldo disponible.
- Solicitud en revision.
- Ultimo cobro pagado.
- Solicitud rechazada.

### Home y premio activo

El home sigue usando:

```http
GET /api/prize
```

Esto esta bien, porque el home muestra el premio activo general de la temporada.

La billetera usa:

```http
GET /api/wallet
POST /api/wallet/claim
```

Esto tambien esta bien, porque la billetera muestra el saldo real del usuario autenticado.

## Ejemplo de flujo real

### Premio activo

```js
Prize {
  amount: "1.000.000",
  status: "activo",
  winner: null
}
```

La billetera del usuario:

```js
Wallet {
  balance: 0,
  pendingBalance: 0,
  totalEarned: 0,
  totalPaid: 0
}
```

### Cierre del premio

El premio pasa a:

```js
Prize {
  amount: "1.000.000",
  status: "cerrado",
  winner: userId
}
```

La billetera queda:

```js
Wallet {
  balance: 1000000,
  pendingBalance: 0,
  totalEarned: 1000000,
  totalPaid: 0
}
```

Y se crea:

```js
WalletTransaction {
  type: "prize_credit",
  amount: 1000000,
  prize: prizeId
}
```

Tambien se crea:

```js
SeasonResult {
  prize: prizeId,
  winner: userId,
  winnerPoints: 150,
  rankingSnapshot: [
    { user: userId, points: 150, position: 1 }
  ],
  pointsResetAt: fecha
}
```

Despues de crear el resultado, todos los usuarios quedan con:

```js
User {
  points: 0
}
```

### Solicitud de cobro

El usuario solicita cobrar.

La billetera queda:

```js
Wallet {
  balance: 0,
  pendingBalance: 1000000,
  totalEarned: 1000000,
  totalPaid: 0
}
```

Y se crea:

```js
WalletClaim {
  amount: 1000000,
  status: "pending"
}
```

### Pago confirmado

Administracion marca la solicitud como `paid`.

La billetera queda:

```js
Wallet {
  balance: 0,
  pendingBalance: 0,
  totalEarned: 1000000,
  totalPaid: 1000000
}
```

Y se crea:

```js
WalletTransaction {
  type: "claim_paid",
  amount: 1000000
}
```

## Consideraciones importantes

- El saldo real vive en `Wallet`, no en `User`.
- `User.points` solo define el ranking.
- `Prize` define el premio y el ganador.
- `SeasonResult` conserva la foto final de la temporada antes del reset.
- `WalletTransaction` permite auditar por que una billetera tiene determinado saldo.
- `WalletClaim` representa el proceso de retiro/cobro.
- La billetera puede acumular varios premios si el usuario gana mas de una vez.
- No se debe modificar `Wallet.balance` manualmente sin crear una transaccion.
