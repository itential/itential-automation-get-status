import { getInput, setOutput, setFailed } from "@actions/core";
import axios from 'axios';
import { ItentialSDK } from "ea-utils/sdk.js";

async function run() {

  const auth_token = getInput("auth_token");
  const auth_username = getInput("auth_username");
  const auth_password = getInput("auth_password");
  const auth_client_id = getInput("auth_client_id");
  const auth_client_secret = getInput("auth_client_secret");
  const time_interval = getInput("time_interval");
  const no_of_attempts = getInput("no_of_attempts");
  const automation_id = getInput("automation_id");
  let itential_host_url = getInput("itential_host_url");
  if (itential_host_url.endsWith('/'))
    itential_host_url = itential_host_url.substring(0, itential_host_url.length - 1);
  let count = 0;

  //using the ea-utils library
  const user = [
    {
      hostname: itential_host_url,
      username: auth_username,
      password: auth_password,
      client_id: auth_client_id,
      client_secret: auth_client_secret,
      token: auth_token
    }
  ]

  const authentication = new ItentialSDK.Authentication(user); 
  const opsApi = new ItentialSDK.OperationsAPI(authentication.users[0].hostname, authentication.users[0].userKey, authentication);
  const health = new ItentialSDK.HealthAPI(authentication.users[0].hostname, authentication.users[0].userKey, authentication);
  const message = "An Itential account is required to get credentials needed to configure the Github Actions." + 
  "In order to utilize this action, you would need to have an active \`Itential Automation Platform\` (IAP)." + 
  "If you are an existing customer, please contact your Itential account team for additional details." + 
  "For new customers interested in an Itential trial, please click [here](https://www.itential.com/get-started/) to request one."

  try {
   //check the status of the automation and return the output (IAP release <= 2021.1)
    const automationStatus211 = (automation_id) => {
      axios
      .get(
        `${itential_host_url}/workflow_engine/job/${automation_id}/details?token=` +
        authentication.users[0].token
      )
        .then((res) => {
          console.log("Automation Status: ", res.data.status);
          if (res.data.status === "running" && count < no_of_attempts) {
            console.log(" Getting Status Attempt # ", count);
            setTimeout(() => {
              count += 1;
              automationStatus211(automation_id);
            }, time_interval * 1000);
          } else if (res.data.status === "complete") {
            axios
            .get(
              `${itential_host_url}/workflow_engine/job/${automation_id}/output?token=` +
              authentication.users[0].token
            )
              .then((res) => {
                setOutput("results", res.data);
              })
              .catch((err) => {
                setFailed(err.response.data);
              });
          } else if (res.data.status === "canceled") {
            setFailed("Automation Canceled");
          } else if (res.data.status === "error") {
            setFailed(res.data.error);
          } else {
            setFailed(
              'Automation Timed out based upon user defined time_interval and no_of_attempts'
            );
          }
        })
        .catch((err) => {
          setFailed(err.response.data);
        });
    };
    
    //check the status of the automation and return the output (IAP release > 2021.1)
    const automationStatus221 = (automation_id) => {

      opsApi.getAutomationResult(automation_id, (res,err) => {

        if (err){
          if(typeof err.IAPerror.stack === "object" && typeof err.IAPerror.stack.response === "object" ) {
            setFailed("origin:" + err.IAPerror.origin + ";" + err.IAPerror.stack.response.data);

          } else setFailed("Failed while getting automation result: " + message);

        } else {

          const result = { 
            automation_status: null,
            automation_output: null
          }
          console.log("Automation Status: ", res.status);
          if ((res.status === "running" || res.status === "paused") && count < no_of_attempts) {
            console.log(" Getting Status Attempt # ", count);
            setTimeout(() => {
              count += 1;
              automationStatus221(automation_id);
            }, time_interval * 1000);
          } else if (res.status === "complete") {
            result.automation_status = res.status;
            result.automation_output = res.variables;
            setOutput("results", result);
          } else if (res.status === "canceled") {
            result.automation_status = res.status;
            setOutput("results", result);
          } else if (res.status === "error") {
            result.automation_status = res.status;
            setOutput("results", result);
          } else {
            console.log('Automation Timed out based upon user defined time_interval and no_of_attempts');
            result.automation_status = res.status;
            setOutput("results", result);
          }
        }
      })
    };

    //start the automation on GitHub event
    const startAutomation = () => {

      health.getServerHealth((res, err)=> {

        if(err){

          if(typeof err.IAPerror.stack === "object" && typeof err.IAPerror.stack.response === "object" ) {
            setFailed("origin:" + err.IAPerror.origin + ";" + err.IAPerror.stack.response.data);

          } else setFailed("Failed while server health check: " + message);

        } else {

          const release = res.release.substring(
            0,
            res.release.lastIndexOf(".")
          );

          if (Number(release) <= 2021.1) automationStatus211(automation_id);
          else automationStatus221(automation_id);

        }

      });

    };

    startAutomation();

  } catch (err) {
    setFailed(err);
  }
}

run();
