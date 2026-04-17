# React Visit Difference + JSON Todo App

This project contains:

- React frontend (Vite)
- Node.js API server (Express)
- Todo storage in JSON file (`data/todos.json`), no database
- Docker container setup
- Azure deployment (App Service for Containers + ACR)
- GitHub Actions workflow for CI/CD

## App behavior

- Shows a different visit message each time based on the previous visit timestamp and visit count (stored in browser localStorage).
- Todo list is read/written to a JSON file via API endpoints.

## Local development

1. Install dependencies:

```powershell
npm install
```

2. Start API server:

```powershell
npm run dev:api
```

3. In another terminal start frontend dev server:

```powershell
npm run dev
```

4. Open http://localhost:5173

## Run production mode locally

```powershell
npm run build
npm run start
```

Open http://localhost:8080

## Docker

Build and run with Docker:

```powershell
docker build -t react-json-todo:local .
docker run --rm -p 8080:8080 react-json-todo:local
```

Or with compose:

```powershell
docker compose up --build
```

## Azure deployment resources

- Resource Group: `rg-react-json-container`
- Azure Container Registry: provided by workflow variable
- Azure Web App for Containers: provided by workflow variable
- Region: provided by workflow variable

## GitHub Actions workflow

Workflow file:

- `.github/workflows/deploy-azure-container.yml`

Set these GitHub secrets in your repository:

- `AZURE_CREDENTIALS`: output from `az ad sp create-for-rbac --name <sp-name> --role contributor --scopes /subscriptions/<subscription-id> --sdk-auth`
- `AZURE_SUBSCRIPTION_ID`: your subscription id

Set these GitHub repository variables (Settings -> Secrets and variables -> Actions -> Variables):

- `RESOURCE_GROUP`
- `LOCATION`
- `WEBAPP_NAME`
- `ACR_NAME`
- `IMAGE_NAME`

Example values:

- `RESOURCE_GROUP=rg-react-json-container`
- `LOCATION=eastus`
- `WEBAPP_NAME=react-json-container-app-20260417`
- `ACR_NAME=reactjsoncontacr20260417`
- `IMAGE_NAME=webapp`

## One-time Azure CLI deployment commands (manual)

After `az login`, run:

```powershell
$subId="7b8227d0-1013-41aa-8201-af2c503b375d"
$rg="rg-react-json-container"
$loc="eastus"
$web="react-json-container-app-20260417"
$acr="reactjsoncontacr20260417"
$image="webapp"

az account set --subscription $subId
az group create --name $rg --location $loc
az deployment group create --resource-group $rg --template-file infra/main.bicep --parameters webAppName=$web acrName=$acr location=$loc imageName="$image`:latest"
az acr build --registry $acr --image "$image`:latest" .
$loginServer=az acr show --name $acr --query loginServer -o tsv
az webapp config container set --name $web --resource-group $rg --container-image-name "$loginServer/$image`:latest"
az webapp restart --name $web --resource-group $rg
az webapp show --name $web --resource-group $rg --query defaultHostName -o tsv
```
