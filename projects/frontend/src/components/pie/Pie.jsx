import { useState, useEffect } from "react";
import "./Pie.css";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { requestJson } from "../../utils/request";
import { formattedMoney } from "../../utils/format";

// register required chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export function PieChartComponent({
  description,
  compare,
  url,
  type,
  simbol = "",
}) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        otherValues: [],
        backgroundColor: [],
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    requestJson(url).then((data) => {
      const labels = data.map((row) => row.position);
      const values = data.map((row) => row[type]);
      const otherValues = data.map(
        (row) => row[type === "employeeCount" ? "percentage" : "employeeCount"]
      );
      const averageSalary = data.map((row) => row.averageSalary);
      const backgroundColors = data.map(
        (_, i) => `hsl(${(i * 360) / data.length}, 70%, 50%)`
      );

      setChartData({
        labels,
        datasets: [
          {
            data: values,
            otherValues,
            averageSalary,
            backgroundColor: backgroundColors,
            borderColor: "#222",
            borderWidth: 1,
          },
        ],
      });
    });
  }, [url, type, simbol]);

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

      <Pie
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const dataset = context.dataset;
                  const value = dataset.data[context.dataIndex];
                  const altValue =
                    dataset.otherValues[context.dataIndex] ?? "?";

                    const averageSalary =
                    formattedMoney(dataset.averageSalary[context.dataIndex] ?? "?");

                  if (type === "employeeCount") {
                    return [`Cantidad: ${value}`, `Porcentaje: ${altValue}%`,`Salario Media: ${averageSalary}`];
                  } else {
                    return [`Porcentaje: ${value}%`, `Cantidad: ${altValue}`,`Salario Media: ${averageSalary}`];
                  }
                },
              },
            },

            legend: {
              position: "bottom",
            },
          },
        }}
      />
    </div>
  );
}
