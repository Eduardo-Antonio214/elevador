const express = require('express');
const elevatorData = require('./elevator.json');

const app = express();
const port = 3000;

app.use(express.json());

function getDirection(destination) {
  return destination > elevatorData.currentFloor ? 'up' : 'down';
}

async function moveElevatorWithDelay() {
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  if (isNaN(elevatorData.currentFloor)) {
    console.log('Andar atual inválido.');
    return;
  }

  if (elevatorData.direction === 'idle' && elevatorData.requestedFloors.length === 0) {
    return;
  }

  if (elevatorData.requestedFloors.length === 0) {
    elevatorData.direction = 'idle';
    return;
  }

  const nextFloor = elevatorData.direction === 'up'
    ? Math.min(...elevatorData.requestedFloors)
    : Math.max(...elevatorData.requestedFloors);

  console.log(`Elevador está no andar ${elevatorData.currentFloor}.`);

  if (elevatorData.direction === 'idle' && elevatorData.requestedFloors.length > 0) {
    const closestFloor = elevatorData.requestedFloors.reduce((acc, curr) => {
      const distance = Math.abs(curr - elevatorData.currentFloor);
      return distance < Math.abs(acc - elevatorData.currentFloor) ? curr : acc;
    }, elevatorData.requestedFloors[0]);

    elevatorData.direction = getDirection(closestFloor);
    await moveElevatorWithDelay();
    return;
  }

  // Verifica se o elevador está sendo chamado para o próximo andar
  if (elevatorData.currentFloor !== nextFloor) {
    console.log(`Elevador chamado para o andar ${nextFloor}.`);
  }

  while (elevatorData.currentFloor !== nextFloor) {
    if (isNaN(elevatorData.currentFloor)) {
      console.log('Andar atual inválido durante o movimento.');
      return;
    }

    console.log(`Passando pelo andar ${elevatorData.currentFloor}`);
    await delay(3000); // Atraso de 3 segundos entre os andares
    elevatorData.currentFloor += elevatorData.direction === 'up' ? 1 : -1;
  }

  console.log(`Elevador chegou ao andar ${nextFloor}.`);

  const floorIndex = elevatorData.requestedFloors.indexOf(nextFloor);
  elevatorData.requestedFloors.splice(floorIndex, 1);

  if (elevatorData.requestedFloors.length === 0) {
    elevatorData.direction = 'idle';
  } else {
    elevatorData.direction = getDirection(elevatorData.requestedFloors[0]);
    await moveElevatorWithDelay();
  }
}

app.post('/callElevator/:floor', async (req, res) => {
  const requestedFloor = parseInt(req.params.floor);

  if (isNaN(requestedFloor) || requestedFloor < 1 || requestedFloor > 30) {
    return res.status(400).json({ error: 'Andar inválido. Escolha um andar entre 1 e 30.' });
  }

  elevatorData.requestedFloors.push(requestedFloor);

  if (elevatorData.direction === 'idle') {
    elevatorData.direction = getDirection(requestedFloor);
    console.log(`Elevador chamado para o andar ${requestedFloor}.`);
    await moveElevatorWithDelay();
  }

  res.json({ message: `Chamada do elevador para o andar ${requestedFloor}.` });
});

app.post('/setDestination/:floor', async (req, res) => {
  const destinationFloor = parseInt(req.params.floor);

  if (isNaN(destinationFloor) || destinationFloor < 1 || destinationFloor > 30) {
    return res.status(400).json({ error: 'Andar inválido. Escolha um andar entre 1 e 30.' });
  }

  elevatorData.requestedFloors.push(destinationFloor);

  if (elevatorData.direction === 'idle') {
    elevatorData.direction = getDirection(destinationFloor);
    console.log(`Elevador chamado para o andar ${destinationFloor}.`);
    await moveElevatorWithDelay();
  }

  res.json({ message: `Andar de destino definido para ${destinationFloor}.` });
});

app.get('/elevator', (req, res) => {
  res.json(elevatorData);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
