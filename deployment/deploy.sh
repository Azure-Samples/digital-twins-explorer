#! /bin/bash

# defaults
RESOURCE_GROUP='digital-twins-explorer'
SIGNALR="false"

usage() { 
  echo "Usage: $0 -n <digital_twins_instance_name> [-e] [-g <resource_group>] [-l <location>]"
  echo "  Deploys a digital twin explorer instance in the given location and resource group"
  echo "  Read rights for the given digital twin are configured appropriately"
  echo "  Use the -e option if you require live telemetry through SignalR"
  exit 1
}

error() {
  echo "An error occurred"
  exit 2
}

# Initialize parameters specified from command line
while getopts ":g:n:l:eh" arg; do
  case "${arg}" in
    n)
      DT_INSTANCE_NAME=${OPTARG}
      ;;
    g)
      RESOURCE_GROUP=${OPTARG}
      ;;
    l)
      LOCATION=${OPTARG}
      ;;
    e)
      SIGNALR="true"
      ;;
    h | *)
      usage
      ;;
    esac
done
shift $((OPTIND-1))

[[ -z "$DT_INSTANCE_NAME" ]] && usage
# same location as the digital twin instance as default
if [[ -z "$LOCATION" ]]; then LOCATION=$(az dt show -n $DT_INSTANCE_NAME --query location -o tsv) || error; fi

if [ $(az group exists --name $RESOURCE_GROUP) = false ]; then
    echo "***** Creating resource group $RESOURCE_GROUP..." 
    az group create --name $RESOURCE_GROUP --location $LOCATION
fi

echo "***** Deploying ARM template"
az deployment group create \
  --name "digital-twins-explorer" \
  --resource-group $RESOURCE_GROUP \
  --template-file "template.json"

STORAGE_ACCOUNT=$(az deployment group show \
  --name "digital-twins-explorer" \
  --resource-group $RESOURCE_GROUP \
  --query "properties.outputs.storageAccountName.value" \
  -o tsv)
FUNCTION_APP=$(az deployment group show \
  --name "digital-twins-explorer" \
  --resource-group $RESOURCE_GROUP \
  --query "properties.outputs.functionAppName.value" \
  -o tsv)
FUNCTION_IDENTITY=$(az deployment group show \
  --name "digital-twins-explorer" \
  --resource-group $RESOURCE_GROUP \
  --query "properties.outputs.functionIdentity.value" \
  -o tsv)

echo "***** Deploying frontend application"
(cd ../client/ && \
npm install && npm run build && \
az storage blob upload-batch -s ../client/build -d "web" --account-name $STORAGE_ACCOUNT
) || error

echo "***** Building and deploying functions"
(cd ../functions && \
dotnet publish -c Release -o ./publish && \
func azure functionapp publish $FUNCTION_APP --csharp
) || error

if [[ "$SIGNALR" == "true" ]]; then
  echo "***** Deploy ARM EventGrid template for SignalR"
  az deployment group create \
    --name "digital-twins-explorer" \
    --resource-group $RESOURCE_GROUP \
    --template-file "template-eventgrid.json" \
    --parameters "digitalTwinsInstance=$DT_INSTANCE_NAME" || error
fi

echo "***** Assign 'Azure Digital Twins Data Reader' role to function app"
az dt role-assignment create -n $DT_INSTANCE_NAME --assignee $FUNCTION_IDENTITY --role "Azure Digital Twins Data Reader" || error

echo "***** DONE. Link to digital twin explorer: https://$FUNCTION_APP.azurewebsites.net"