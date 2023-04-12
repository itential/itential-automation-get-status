const { getInput, setOutput, setFailed } = require("@actions/core");
const { get } = require('axios');

async function run() {
  const IAP_TOKEN = getInput("IAP_TOKEN");
  const TIME_INTERVAL = getInput("TIME_INTERVAL");
  const NO_OF_ATTEMPTS = getInput("NO_OF_ATTEMPTS");
  const JOB_ID = getInput("JOB_ID");
  if (IAP_INSTANCE.endsWith('/'))
    IAP_INSTANCE = IAP_INSTANCE.substring(0, IAP_INSTANCE.length - 1);
  let count = 0;

  try {
    //check the status of the job and return the output (IAP release <= 2021.1)
    const jobStatus211 = (job_id) => {
      get(
        `${IAP_INSTANCE}/workflow_engine/job/${job_id}/details?token=` +
          IAP_TOKEN
      )
        .then((res) => {
          console.log("Job Status: ", res.data.status);

          if (res.data.status === "running" && count < NO_OF_ATTEMPTS) {
            setTimeout(() => {
              count += 1;
              jobStatus211(job_id);
            }, TIME_INTERVAL * 1000);
          } else if (res.data.status === "complete") {
            get(
              `${IAP_INSTANCE}/workflow_engine/job/${job_id}/output?token=` +
                IAP_TOKEN
            )
              .then((res) => {
                setOutput("results", res.data.variables);
              })
              .catch((err) => {
                setFailed(err.response.data);
              });
          } else if (res.data.status === "canceled") {
            setFailed("Job Canceled");
          } else if (res.data.status === "error") {
            setFailed(res.data.error);
          } else {
            setFailed(
              'Job Timed out based upon user defined TIME_INTERVAL and NO_OF_ATTEMPTS'
            );
          }
        })
        .catch((err) => {
          setFailed(err.response.data);
        });
    };

    //check the status of the job and return the output (IAP release > 2021.1)
    const jobStatus221 = (job_id) => {
      get(
        `${IAP_INSTANCE}/operations-manager/jobs/${job_id}?token=` + IAP_TOKEN
      )
        .then((res) => {
          console.log("Job Status: ", res.data.data.status);
          if (res.data.data.status === "running" && count < NO_OF_ATTEMPTS) {
            setTimeout(() => {
              count += 1;
              jobStatus221(job_id);
            }, TIME_INTERVAL * 1000);
          } else if (res.data.data.status === "complete") {
            setOutput("results", res.data.data.variables);
          } else if (res.data.data.status === "canceled") {
            setFailed("Job Canceled");
          } else if (res.data.data.status === "error") {
            setFailed(res.data.data.error);
          } else {
            setFailed(
              'Job Timed out based upon user defined TIME_INTERVAL and NO_OF_ATTEMPTS'
            );
          }
        })
        .catch((err) => {
          setFailed(err.response.data);
        });
    };

    //start the job on GitHub event
    const startJob = () => {
      get(`${IAP_INSTANCE}/health/server?token=` + IAP_TOKEN)
        .then((res) => {
          const release = res.data.release.substring(
            0,
            res.data.release.lastIndexOf(".")
          );
          if (Number(release) <= 2021.1) jobStatus211(JOB_ID);
          else jobStatus221(JOB_ID);
        })
        .catch((err) => {
          setFailed(err);
        });
    };

    startJob();
  } catch (e) {
    setFailed(e);
  }
}

run();
