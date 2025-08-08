import { useState, useRef, useEffect } from "react";
import "./Pie.css";
import { CompareCharts } from "../compareCharts/CompareCharts";
import { PieChart } from "@mui/x-charts";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

let isLoad = {};

const series = [
  {
    data: [
      { id: 0, value: 10, label: "series A" },
      { id: 1, value: 15, label: "series B" },
      { id: 2, value: 20, label: "series C" },
    ],
  },
];

export function Pie({ description, topic, customTheme, compare, deparment }) {
  const [openModal, setOpenModal] = useState(false);
  const containerChart = useRef();

  const verifyVisibility = async (entry) => {
  };

  useEffect(() => {
    isLoad = {};
  }, []);

  const addNewChart = async (url) => {
  };

  const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

  return (
    <>
      {openModal && (
        <CompareCharts
          include={description}
          notInclude={deparment}
          open={openModal}
          setOpen={setOpenModal}
          addNewChart={addNewChart}
        />
      )}
      <div className="custom-chart-card">
        <div className="custom-chart-card-title">
          <h3>{description}</h3>
          <div>
            <a href="#">Fuentes</a>
            {compare && (
              <a href="#" onClick={() => setOpenModal(true)}>
                Comparar
              </a>
            )}
          </div>
        </div>
        <div>
          <ThemeProvider theme={darkTheme}>
            <PieChart series={series} width={200} height={200} />
          </ThemeProvider>
        </div>
      </div>
    </>
  );
}
