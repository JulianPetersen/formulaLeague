# Cierre de temporada

Este documento explica como queda el flujo de cierre de temporada en Formula League.

## Objetivo

Cuando se cierra el premio de temporada, la temporada competitiva termina. En ese momento el sistema debe:

1. Determinar el ganador.
2. Asignar el ganador al premio.
3. Depositar el monto del premio en la billetera del ganador.
4. Guardar una foto historica del ranking final.
5. Reiniciar los puntos de todos los usuarios para la nueva temporada.

## Archivo principal

El flujo se dispara desde:

```txt
src/controllers/prize.controller.js
```

Cuando un premio recibe:

```json
{
  "status": "cerrado"
}
```

se ejecuta la logica de cierre.

## Modelo `SeasonResult`

El cierre historico se guarda en:

```txt
src/models/seasonResult.model.js
```

Campos principales:

```js
prize
winner
winnerPoints
rankingSnapshot
closedAt
pointsResetAt
```

### `prize`

Referencia al premio cerrado.

Cada premio puede tener un solo `SeasonResult`. Esto evita cerrar dos veces la misma temporada.

### `winner`

Usuario ganador de la temporada.

### `winnerPoints`

Cantidad de puntos que tenia el ganador antes del reset.

### `rankingSnapshot`

Foto del ranking final antes de reiniciar puntos.

Cada item guarda:

```js
user
username
email
points
position
```

Esto permite consultar el resultado historico aunque despues todos los usuarios vuelvan a `0` puntos.

### `closedAt`

Fecha en la que se cerro la temporada.

### `pointsResetAt`

Fecha en la que se reiniciaron los puntos.

Si este campo existe, significa que el reset ya fue ejecutado.

## Utilidad `closeSeasonForPrize`

La logica de cierre esta en:

```txt
src/utils/season.js
```

Funcion:

```js
closeSeasonForPrize(prize)
```

Esta funcion solo actua si:

```js
prize.status === "cerrado"
prize.winner existe
```

Si el premio no esta cerrado o no tiene ganador, no hace nada.

## Orden del flujo

Cuando se cierra un premio, el backend hace esto:

```txt
1. Buscar premio
2. Cambiar status a "cerrado"
3. Si no tiene winner, buscar usuario con mas puntos
4. Guardar winner en Prize
5. Guardar Prize
6. Depositar premio en Wallet
7. Crear SeasonResult
8. Resetear User.points a 0
```

## Calculo del ganador

El ganador se calcula buscando el usuario con mas puntos:

```js
User.findOne()
  .sort({ points: -1, createdAt: 1 })
```

Esto significa:

- Primero gana quien tenga mas `points`.
- Si hay empate, gana el usuario mas antiguo.

## Deposito en billetera

Antes de reiniciar puntos, el sistema deposita el premio en la billetera del ganador usando:

```txt
src/utils/wallet.js
```

Funcion:

```js
depositPrizeToWinner(prize)
```

Esto crea una transaccion:

```js
WalletTransaction {
  type: "prize_credit",
  prize: prizeId,
  user: winnerId,
  amount: prizeAmount
}
```

Y actualiza la billetera:

```js
wallet.balance += amount
wallet.totalEarned += amount
```

## Reset de puntos

Despues de crear el `SeasonResult`, se ejecuta:

```js
User.updateMany({}, { $set: { points: 0 } })
```

Esto reinicia los puntos de todos los usuarios.

Los puntos anteriores no se pierden porque quedan guardados en:

```js
SeasonResult.rankingSnapshot
```

## Idempotencia

El cierre esta pensado para no duplicarse si se ejecuta mas de una vez.

### Deposito del premio

`depositPrizeToWinner` revisa si ya existe una transaccion:

```js
type: "prize_credit"
prize: prizeId
```

Si existe, no vuelve a depositar.

### Resultado de temporada

`closeSeasonForPrize` revisa si ya existe:

```js
SeasonResult.findOne({ prize: prize._id })
```

Si existe, no vuelve a crear snapshot.

Si el resultado existe pero `pointsResetAt` esta vacio, completa el reset de puntos y guarda `pointsResetAt`.

## Ejemplo completo

### Antes del cierre

```js
Prize {
  _id: prizeId,
  amount: "1.000.000",
  status: "activo",
  winner: null
}
```

Usuarios:

```js
User A { points: 150 }
User B { points: 120 }
User C { points: 90 }
```

### Se cierra el premio

Request:

```json
{
  "status": "cerrado"
}
```

### Resultado

El premio queda:

```js
Prize {
  status: "cerrado",
  winner: userA
}
```

La billetera del ganador queda:

```js
Wallet {
  user: userA,
  balance: 1000000,
  totalEarned: 1000000
}
```

Se crea:

```js
SeasonResult {
  prize: prizeId,
  winner: userA,
  winnerPoints: 150,
  rankingSnapshot: [
    { user: userA, points: 150, position: 1 },
    { user: userB, points: 120, position: 2 },
    { user: userC, points: 90, position: 3 }
  ],
  pointsResetAt: fecha
}
```

Usuarios despues del cierre:

```js
User A { points: 0 }
User B { points: 0 }
User C { points: 0 }
```

## Consideraciones

- El reset de puntos ocurre solamente al cerrar un premio.
- El historial de puntos queda en `SeasonResult`.
- La billetera conserva el saldo aunque empiece una nueva temporada.
- Si se abre un nuevo premio despues, los usuarios compiten desde `0`.
- El sistema sigue estando pensado para un solo premio activo a la vez.
