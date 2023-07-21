const { getInput, setOutput, setFailed } = require("@actions/core");
const { get } = require('axios');

async function run() {
  const iap_token = getInput("iap_token");
  const time_interval = getInput("time_interval");
  const no_of_attempts = getInput("no_of_attempts");
  const automation_id = getInput("automation_id");
  let iap_instance = getInput("iap_instance");
  if (iap_instance.endsWith('/'))
    iap_instance = iap_instance.substring(0, iap_instance.length - 1);
  let count = 0;

  console.log(time_interval);
  console.log(no_of_attempts);

  try {
    //check the status of the automation and return the output (IAP release <= 2021.1)
    const automationStatus211 = (automation_id) => {
      get(
        `${iap_instance}/workflow_engine/job/${automation_id}/details?token=` +
          iap_token
      )
        .then((res) => {
          console.log("Automation Status: ", res.data.status);

          if (res.data.status === "running" && count < no_of_attempts) {
            setTimeout(() => {
              count += 1;
              automationStatus211(automation_id);
            }, time_interval * 1000);
          } else if (res.data.status === "complete") {
            get(
              `${iap_instance}/workflow_engine/job/${automation_id}/output?token=` +
                iap_token
            )
              .then((res) => {
                setOutput("results", res.data.variables);
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
      get(
        `${iap_instance}/operations-manager/jobs/${automation_id}?token=` + iap_token
      )
        .then((res) => {
          console.log("Automation Status: ", res.data.data.status);
          if (res.data.data.status === "running" && count < no_of_attempts) {
            console.log("count: ", count);
            setTimeout(() => {
              count += 1;
              automationStatus221(automation_id);
            }, time_interval * 1000);
          } else if (res.data.data.status === "complete") {
            setOutput("results", res.data.data.variables);
          } else if (res.data.data.status === "canceled") {
            setFailed("Automation Canceled");
          } else if (res.data.data.status === "error") {
            setFailed(res.data.data.error);
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

    //start the automation on GitHub event
    const startAutomation = () => {
      get(`${iap_instance}/health/server?token=` + iap_token)
        .then((res) => {
          const release = res.data.release.substring(
            0,
            res.data.release.lastIndexOf(".")
          );
          if (Number(release) <= 2021.1) automationStatus211(automation_id);
          else automationStatus221(automation_id);
        })
        .catch((err) => {
          setFailed(err);
        });
    };

    startAutomation();
  } catch (e) {
    setFailed(e);
  }
}

run();
