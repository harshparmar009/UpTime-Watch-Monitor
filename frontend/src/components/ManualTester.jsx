import { useState } from "react";
// import axios from "axios";

import styles from "./ManualTester.module.css"; 

import { manualCheckEndpoint } from "../utils/api";

export default function ManualTester({
  monitorId,
  endpointId,
  endpoint,
}) {

  
  const [requestBody, setRequestBody] =
    useState("{}");

  //   const [pathParams, setPathParams] =
  // useState("{}");

  const [pathParams, setPathParams] =
      useState({});
  
    const [queryParams, setQueryParams] =
      useState({});

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [error, setError] =
    useState("");

    const hasPathParams =
  endpoint?.path?.includes("{");

  async function runCheck() {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      console.log("Running manual check for monitorId:", monitorId, "endpointId:", endpointId, "with requestBody:", requestBody);

     let parsedBody = {};
let parsedParams = {};

try {
  parsedBody = JSON.parse(
    requestBody || "{}"
  );

  
  parsedParams = pathParams;
} catch {
  setError("Invalid JSON format");
  setLoading(false);
  return;
}

      const token =
        localStorage.getItem("token");

      // const response =
      //   await axios.post(
      //     `${
      //       import.meta.env.VITE_API_URL
      //     }/swagger/${monitorId}/endpoints/${endpointId}/manual-check`,
      //     parsedBody,
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     }
      //   );

        const response =
          await manualCheckEndpoint(
            monitorId,
            endpointId,
            {
              requestBody: parsedBody,
              pathParams: parsedParams,
            }
          );

      setResult(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        Manual API Testing
      </h3>

      <div className={styles.field}>
        <label>
          Request Body (JSON)
        </label>

        <textarea
          value={requestBody}
          onChange={(e) =>
            setRequestBody(
              e.target.value
            )
          }
          className={styles.textarea}
          placeholder={`{
  "email":"test@test.com",
  "password":"123456"
}`}
        />
      </div>

      {/* Only show path parameters input if the endpoint has path parameters */}
   {hasPathParams && (
  <div className={styles.field}>
    <label>
      Path Parameters
    </label>

    {endpoint.pathParams?.map(
      (param) => (
        <div
          key={param.name}
          style={{
            marginBottom: "10px",
          }}
        >
          <input
            type="text"
            placeholder={param.name}
            value={
              pathParams[
                param.name
              ] || ""
            }
            onChange={(e) =>
              setPathParams(
                (prev) => ({
                  ...prev,
                  [param.name]:
                    e.target.value,
                })
              )
            }
          />
        </div>
      )
    )}
  </div>
)}

      <button
        onClick={runCheck}
        disabled={loading}
        className={styles.button}
      >
        {loading
          ? "Running..."
          : "Run Check"}
      </button>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {result && (
        <div className={styles.result}>
          <div
            className={styles.resultHeader}
          >
            <div>
              <strong>Status:</strong>{" "}
              {result.statusCode}
            </div>

            <div>
              <strong>
                Response Time:
              </strong>{" "}
              {result.responseTime}
              ms
            </div>
          </div>

          {/* <h4>
            Response Body
          </h4>

          <pre
            className={
              styles.response
            }
          >
            {JSON.stringify(
              result.responseBody,
              null,
              2
            )}
          </pre> */}
        </div>
      )}
    </div>
  );
}