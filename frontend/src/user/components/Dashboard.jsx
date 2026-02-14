import "../styles/userDash.css"
import { MdSubscriptions, MdOutlineTrackChanges } from "react-icons/md";
import { FaBullseye, FaChartLine } from "react-icons/fa";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [packageName, setPackageName] = useState("");
  const [goal, setGoal] = useState(0);
  const [goalStatus, setGoalStatus] = useState(0);
  const [isComplete, setIsComplete] = useState(true);

  const [myUser, setMyUser] = useState(null);
  const [reportDeclared, setReportDeclared] = useState(false);

  const [timeLeft, setTimeLeft] = useState("");

  const token = localStorage.getItem("token");
  const id = localStorage.getItem("userId");

  const navigate = useNavigate();

  const formatDateTimeIN = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "-";

    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ✅ load local user first (fast UI)
  useEffect(() => {
    const users = localStorage.getItem("user");
    if (users) {
      try {
        const parsedUser = JSON.parse(users);
        setMyUser(parsedUser);
      } catch {
        setMyUser(null);
      }
    } else {
      setMyUser(null);
    }
  }, []);

  const getStats = async () => {
    try {
      // IMPORTANT: backend must return expiry in this API
      // return { packageName, goal, totalFormsDone, reportDeclared, expiry }
      const res = await axios.get(`https://api.freelancing-projects.com/api/user/${id}/get-dashstats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPackageName(res.data.packageName);
      setGoal(res.data.goal);
      setGoalStatus(res.data.totalFormsDone);
      setReportDeclared(!!res.data.reportDeclared);
      setIsComplete(res.data?.isComplete === false ? false : true);

      // ✅ keep expiry always fresh (avoid old localStorage expiry)
      if (res.data.expiry) {
        setMyUser((prev) => {
          const updated = prev ? { ...prev, expiry: res.data.expiry } : { expiry: res.data.expiry };
          // optional: update localStorage so refresh also stays correct
          try {
            localStorage.setItem("user", JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (err) {
      if (err.response?.data?.message) alert(err.response.data.message);
      else alert("Error Getting Dashboard Stats");
    }
  };

  useEffect(() => {
    if (id && token) getStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  // ✅ Correct timer: uses expiry date+time as stored (NO 23:59 override)
  useEffect(() => {
    if (!myUser?.expiry) {
      setTimeLeft("-");
      return;
    }

    const pad = (n) => String(n).padStart(2, "0");

    const compute = () => {
      const expiry = new Date(myUser.expiry);
      if (isNaN(expiry.getTime())) {
        setTimeLeft("-");
        return;
      }

      const now = new Date();
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft(`${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [myUser?.expiry]);

  const handleReportClick = () => {
    navigate("/result");
  };



  if (!myUser) {
    return <p>Loading Profile...</p>;
  }

  return (
    <div className="mydassh">
      <h3>Dashboard</h3>

      <div className="boxes">
        <div className="box" onClick={() => navigate("/profile")}>
          <MdSubscriptions className="icn" />
          <div className="inbox">
            <h5>Plan</h5>
            <h4>{packageName}</h4>
            <p className="forms">Data Segregation</p>
          </div>
        </div>

        <div className="box" onClick={() => navigate("/work")}>
          <FaBullseye className="icn" />
          <div className="inbox">
            <h5>Goal</h5>
            <h4>{goal}</h4>
            <p className="forms">Forms</p>
          </div>
        </div>

        <div className="box" onClick={() => navigate("/entries")}>
          <MdOutlineTrackChanges className="icn" />
          <div className="inbox">
            <h5>Goal Status</h5>
            <h4>{goalStatus}</h4>
            <p className="forms">Forms</p>
          </div>
        </div>

        <div className="box" onClick={handleReportClick}>
          <FaChartLine className="icn" />
          <div className="inbox">
            <h5>Report</h5>
            <h4>
              {!reportDeclared ? "Not Declared" : !isComplete ? "Incomplete" : "Click to See"}
            </h4>
            <p className="forms">Your Reports</p>
          </div>
        </div>
      </div>

      <p style={{ textAlign: "center", marginBottom: "6px" }}>
        <strong>Subscription Validity:</strong> {formatDateTimeIN(myUser.expiry)}
      </p>

      <p style={{ textAlign: "center", fontWeight: 700 }}>Time Left: {timeLeft}</p>
    </div>
  );
}

export default Dashboard;
