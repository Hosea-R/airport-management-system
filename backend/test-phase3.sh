#!/bin/bash

echo "=== TESTS PHASE 3 - API Vols ==="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Login SuperAdmin
echo -e "${YELLOW}[1/8] Connexion SuperAdmin...${NC}"
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@airport.mg","password":"admin123"}' \
  | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Échec de la connexion${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Token récupéré${NC}"
echo ""

# 2. Récupérer les aéroports
echo -e "${YELLOW}[2/8] Récupération des aéroports...${NC}"
AIRPORTS=$(curl -s http://localhost:5000/api/airports \
  -H "Authorization: Bearer $TOKEN")

TNR_ID=$(echo $AIRPORTS | jq -r '.data[] | select(.code=="TNR") | ._id')
TMM_ID=$(echo $AIRPORTS | jq -r '.data[] | select(.code=="TMM") | ._id')

echo -e "${GREEN}✅ TNR ID: $TNR_ID${NC}"
echo -e "${GREEN}✅ TMM ID: $TMM_ID${NC}"
echo ""

# 3. Récupérer une compagnie
echo -e "${YELLOW}[3/8] Récupération des compagnies...${NC}"
AIRLINES=$(curl -s http://localhost:5000/api/airlines \
  -H "Authorization: Bearer $TOKEN")

AIRLINE_ID=$(echo $AIRLINES | jq -r '.data[0]._id')
echo -e "${GREEN}✅ Compagnie ID: $AIRLINE_ID${NC}"
echo ""

# 4. Créer un vol
echo -e "${YELLOW}[4/8] Création d'un vol TNR → TMM...${NC}"
TOMORROW=$(date -d "+1 day" +%Y-%m-%dT10:00:00.000Z)
TOMORROW_ARRIVAL=$(date -d "+1 day" +%Y-%m-%dT11:30:00.000Z)

CREATE_FLIGHT=$(curl -s -X POST http://localhost:5000/api/flights \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"flightNumber\": \"MD001\",
    \"airlineId\": \"$AIRLINE_ID\",
    \"aircraftType\": \"ATR72\",
    \"departureAirportId\": \"$TNR_ID\",
    \"arrivalAirportId\": \"$TMM_ID\",
    \"scheduledDeparture\": \"$TOMORROW\",
    \"scheduledArrival\": \"$TOMORROW_ARRIVAL\",
    \"remarks\": \"Vol de test\"
  }")

DEPARTURE_ID=$(echo $CREATE_FLIGHT | jq -r '.data.departureFlight._id')
ARRIVAL_ID=$(echo $CREATE_FLIGHT | jq -r '.data.arrivalFlight._id')

if [ "$DEPARTURE_ID" != "null" ] && [ "$ARRIVAL_ID" != "null" ]; then
  echo -e "${GREEN}✅ Vol créé avec succès${NC}"
  echo -e "${GREEN}   Départ ID: $DEPARTURE_ID${NC}"
  echo -e "${GREEN}   Arrivée ID: $ARRIVAL_ID${NC}"
else
  echo -e "${RED}❌ Échec création vol${NC}"
  echo $CREATE_FLIGHT | jq '.'
fi
echo ""

# 5. Récupérer le vol
echo -e "${YELLOW}[5/8] Récupération du vol créé...${NC}"
FLIGHT=$(curl -s http://localhost:5000/api/flights/$DEPARTURE_ID \
  -H "Authorization: Bearer $TOKEN")

if [ "$(echo $FLIGHT | jq -r '.success')" = "true" ]; then
  echo -e "${GREEN}✅ Vol récupéré${NC}"
  echo "   Numéro: $(echo $FLIGHT | jq -r '.data.flightNumber')"
  echo "   Statut: $(echo $FLIGHT | jq -r '.data.status')"
  echo "   Type: $(echo $FLIGHT | jq -r '.data.flightType')"
else
  echo -e "${RED}❌ Échec récupération${NC}"
fi
echo ""

# 6. Ajouter un retard
echo -e "${YELLOW}[6/8] Ajout d'un retard de 30 minutes...${NC}"
DELAY=$(curl -s -X POST http://localhost:5000/api/flights/$DEPARTURE_ID/delay \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"delayMinutes": 30}')

if [ "$(echo $DELAY | jq -r '.success')" = "true" ]; then
    echo -e "${GREEN}✅ Retard ajouté${NC}"
  echo "   Nouveau statut: $(echo $DELAY | jq -r '.data.status')"
  echo "   Retard: $(echo $DELAY | jq -r '.data.delayMinutes') minutes"
else
  echo -e "${RED}❌ Échec ajout retard${NC}"
  echo $DELAY | jq '.'
fi
echo ""

# 7. Annuler le vol
echo -e "${YELLOW}[7/8] Annulation du vol...${NC}"
CANCEL=$(curl -s -X POST http://localhost:5000/api/flights/$DEPARTURE_ID/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test d'\''annulation pour validation système"}')

if [ "$(echo $CANCEL | jq -r '.success')" = "true" ]; then
  echo -e "${GREEN}✅ Vol annulé${NC}"
  echo "   Statut: $(echo $CANCEL | jq -r '.data.status')"
  echo "   Raison: $(echo $CANCEL | jq -r '.data.cancellationReason')"
else
  echo -e "${RED}❌ Échec annulation${NC}"
  echo $CANCEL | jq '.'
fi
echo ""

# 8. Supprimer le vol
echo -e "${YELLOW}[8/8] Suppression du vol...${NC}"
DELETE=$(curl -s -X DELETE http://localhost:5000/api/flights/$DEPARTURE_ID \
  -H "Authorization: Bearer $TOKEN")

if [ "$(echo $DELETE | jq -r '.success')" = "true" ]; then
  echo -e "${GREEN}✅ Vol supprimé (départ et arrivée)${NC}"
else
  echo -e "${RED}❌ Échec suppression${NC}"
  echo $DELETE | jq '.'
fi
echo ""

echo -e "${GREEN}=== TESTS TERMINÉS ===${NC}"
echo ""
echo "Vérifications MongoDB :"
echo "  mongosh"
echo "  use airport_madagascar"
echo "  db.flights.find().pretty()"
echo "  db.logs.find({action: /flight/}).sort({timestamp:-1}).limit(10).pretty()"