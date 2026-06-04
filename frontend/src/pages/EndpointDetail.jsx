import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  Clock,
  Wifi
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import { getEndpoint } from "../utils/api";
// import { subscribe } from "../utils/websocket";

import styles from "./EndpointDetail.module.css";
import ManualTester from "../components/ManualTester";


export default function EndpointDetail() {
  const { monitorId, endpointId } = useParams();
  const navigate = useNavigate();

  const [endpoint, setEndpoint] = useState(null);
  const [events, setEvents] = useState([]);
  const [expandedEvent, setExpandedEvent] = useState(null);
  // const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEndpoint();
  }, [endpointId]);

  // useEffect(() => {
  //   const unsubscribe = subscribe(
  //     endpointId,
  //     (event) => {
  //       setWsConnected(true);

  //       setEvents((prev) =>
  //         [event, ...prev].slice(0, 50)
  //       );

  //       setEndpoint((prev) => {
  //         if (!prev) return prev;

  //         return {
  //           ...prev,
  //           lastStatusCode: event.statusCode,
  //           lastResponseTime: event.responseTime,
  //           lastEventAt: event.timestamp,
  //           totalRequests:
  //             (prev.totalRequests || 0) + 1,
  //           totalErrors:
  //             event.statusCode >= 400
  //               ? (prev.totalErrors || 0) + 1
  //               : prev.totalErrors,
  //           status:
  //             event.statusCode >= 400
  //               ? "error"
  //               : "active"
  //         };
  //       });
  //     }
  //   );

  //   return () => {
  //     setWsConnected(false);
  //     unsubscribe();
  //   };
  // }, [endpointId]);

  async function loadEndpoint() {
    try {
      const res = await getEndpoint(
        monitorId,
        endpointId
      );

      setEndpoint(res.data.endpoint);
      setEvents(res.data.events || []);

      // console.log("Loaded endpoint:", res.data.endpoint, "and events:", res.data.events);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        Loading endpoint...
      </div>
    );
  }

  if (!endpoint) {
    return (
      <div className={styles.loading}>
        Endpoint not found
      </div>
    );
  }

  const errorRate =
    endpoint.totalRequests > 0
      ? (
          (endpoint.totalErrors /
            endpoint.totalRequests) *
          100
        ).toFixed(1)
      : 0;

      // console.log("Calculating chart data from events:", events);
  const chartData = [...events]
    .slice(0, 100)
    .reverse()
    .map((event) => ({
      time: new Date(
        event.timestamp
      ).toLocaleTimeString(),
      responseTime:
        event.responseTime || 0,
      statusCode:
        event.statusCode || 0
    }));

  const avgResponse =
    chartData.length > 0
      ? Math.round(
          chartData.reduce(
            (sum, item) =>
              sum + item.responseTime,
            0
          ) / chartData.length
        )
      : 0;

  const methodClass =
    styles[
      endpoint.method?.toLowerCase()
    ] || "";

  const statusClass =
    endpoint.status === "active"
      ? styles.active
      : endpoint.status === "error"
      ? styles.error
      : styles.unknown;

  return (
    <div className={styles.page}>
      {/* Header */}

      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() =>
            navigate(
              `/monitors/${monitorId}`
            )
          }
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div
          className={
            styles.endpointHeader
          }
        >
          <div
            className={
              styles.endpointTitle
            }
          >
            <span
              className={`${styles.methodBadge} ${methodClass}`}
            >
              {endpoint.method}
            </span>

            <h1>
              {endpoint.path}
            </h1>
          </div>

          <div
            className={
              styles.statusContainer
            }
          >
            <span
              className={`${styles.statusBadge} ${statusClass}`}
            >
              {endpoint.status}
            </span>

            {/* <div
              className={
                styles.live
              }
            >
              {wsConnected && (
                <span
                  className={
                    styles.liveDot
                  }
                />
              )}

              <Wifi size={14} />

              {wsConnected
                ? "Live"
                : "Offline"}
            </div> */}

            
            {/* changes using cron */}

            <div className={styles.live}>
  Mode:
  {" "}
  {endpoint.monitorMode === "cron"
    ? "Auto"
    : "Manual"}
</div>

          </div>
        </div>
      </div>

      {/* Stats */}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Activity size={18} />
          <div>
            <div className={styles.statValue}>
              {endpoint.totalRequests || 0}
            </div>
            <div className={styles.statLabel}>
              Total Requests
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <AlertTriangle size={18} />
          <div>
            <div className={styles.statValue}>
              {endpoint.totalErrors || 0}
            </div>
            <div className={styles.statLabel}>
              Total Errors
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <Activity size={18} />
          <div>
            <div className={styles.statValue}>
              {errorRate}%
            </div>
            <div className={styles.statLabel}>
              Error Rate
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <Clock size={18} />
          <div>
            <div className={styles.statValue}>
              {avgResponse}ms
            </div>
            <div className={styles.statLabel}>
              Avg Response
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <Activity size={18} />
          <div>
            <div className={styles.statValue}>
              {endpoint.lastStatusCode ||
                "-"}
            </div>
            <div className={styles.statLabel}>
              Last Status
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <Clock size={18} />
          <div>
            <div className={styles.statValue}>
              {endpoint.lastEventAt
                ? new Date(
                    endpoint.lastEventAt
                  ).toLocaleTimeString()
                : "-"}
            </div>
            <div className={styles.statLabel}>
              Last Seen
            </div>
          </div>
        </div>
      </div>


      {endpoint.monitorMode === "manual" && (
          <ManualTester
            monitorId={monitorId}
            endpointId={endpoint._id}
            endpoint={endpoint}
          />
        )}


      {/* Chart */}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          Response Time
        </div>

        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <AreaChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis dataKey="time" />

            <YAxis />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="responseTime"
              stroke={
                endpoint.status ===
                "error"
                  ? "#ef4444"
                  : "#22c55e"
              }
              fillOpacity={0.15}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Live Feed */}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          Live Events
        </div>

        <div className={styles.feed}>
          {events.map((event, index) => (
            <div
              key={
                event._id ||
                `${event.timestamp}-${index}`
              }
              className={
                styles.event
              }
              onClick={() =>
                setExpandedEvent(
                  expandedEvent ===
                    (event._id ||
                      index)
                    ? null
                    : (event._id ||
                        index)
                )
              }
            >
              <div
                className={
                  styles.eventHeader
                }
              >
                <div
                  className={
                    styles.eventTime
                  }
                >
                  {new Date(
                    event.timestamp
                  ).toLocaleTimeString()}
                </div>

                <div>
                  {event.method}
                </div>

                <div
                  className={
                    styles.eventPath
                  }
                >
                  {event.path}
                </div>

                <div
                  className={
                    event.statusCode >=
                    400
                      ? styles.codeError
                      : styles.codeSuccess
                  }
                >
                  {event.statusCode}
                </div>

                <div
                  className={
                    styles.responseTime
                  }
                >
                  {event.responseTime}
                  ms
                </div>
              </div>

              {event.errorMessage && (
                <div
                  className={
                    styles.errorMessage
                  }
                >
                  {event.errorMessage}
                </div>
              )}

              {expandedEvent ===
                (event._id ||
                  index) && (
                <div
                  className={
                    styles.inspector
                  }
                >
                  <div
                    className={
                      styles.inspectorTitle
                    }
                  >
                    Request Body
                  </div>

                  <pre
                    className={
                      styles.codeBlock
                    }
                  >
{JSON.stringify(
  event.requestBody || {},
  null,
  2
)}
                  </pre>

                  <div
                    className={
                      styles.inspectorTitle
                    }
                  >
                    Response Body
                  </div>

                  <pre
                    className={
                      styles.codeBlock
                    }
                  >
{JSON.stringify(
  event.responseBody || {},
  null,
  2
)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}