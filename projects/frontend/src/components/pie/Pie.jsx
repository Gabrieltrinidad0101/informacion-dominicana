import { useState, useEffect } from "react";
import "./Pie.css";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { createTheme, ThemeProvider } from "@mui/material";
import { requestJson } from "../../utils/request";

// register required chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export function PieChartComponent({ description, compare, url }) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    requestJson(url).then((data) => {
      const labels = data.map((row) => row.position);
      const values = data.map((row) => row.percentage);
      const backgroundColors = data.map(
        (_, i) =>
          `hsl(${(i * 360) / data.length}, 70%, 50%)` // generate different colors
      );

      setChartData({
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: backgroundColors,
            borderColor: "#222",
            borderWidth: 1,
          },
        ],
      });
    });
  }, [url]);

  const darkTheme = createTheme({ palette: { mode: "dark" } });

  return (
    <div className="custom-chart-card">
      <div className="custom-chart-card-title">
        <h3>{description}</h3>
        <div>
          <a href="#">Fuentes</a>
          {compare && (
            <a href="#" onClick={() => alert("Comparar modal not implemented")}>
              Comparar
            </a>
          )}
        </div>
      </div>

      <ThemeProvider theme={darkTheme}>
        <Pie
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const row = context.dataset.data[context.dataIndex];
                    const employeeCount =
                      context.dataset.data[context.dataIndex]?.employeeCount ?? "?";
                    return `Cantidad: ${employeeCount}\n${row}%`;
                  },
                },
              },
              legend: {
                position: "bottom",
              },
            },
          }}
        />
      </ThemeProvider>
    </div>
  );
}
