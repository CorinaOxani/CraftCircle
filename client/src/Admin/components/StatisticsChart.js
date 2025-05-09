import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Title,
    Filler 
} from "chart.js";

ChartJS.register(
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Title,
    Filler
);


const StatisticsChart = ({ endpoint, title }) => {
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:4000/admin/statistics/${endpoint}/progress`);
                const data = await response.json();

                if (endpoint === "app") {
                    const labels = data.likes.map(item => item.month);
                    const likesData = data.likes.map(item => item.count);
                    const followsData = data.follows.map(item => item.count);

                    setChartData({
                        labels,
                        datasets: [
                            {
                                label: "Total Likes",
                                data: likesData,
                                fill: true,
                                backgroundColor: "rgba(221, 107, 86, 0.2)",
                                borderColor: "#d36b56",
                                borderWidth: 2,
                                tension: 0.4,
                            },
                            {
                                label: "Total Follows",
                                data: followsData,
                                fill: true,
                                backgroundColor: "rgba(107, 184, 221, 0.2)",
                                borderColor: "#6bb8dd",
                                borderWidth: 2,
                                tension: 0.4,
                            }
                        ]
                    });
                } else {
                    const labels = data.map(item => item.month);
                    const values = data.map(item => item.count);

                    setChartData({
                        labels,
                        datasets: [
                            {
                                label: title,
                                data: values,
                                fill: true,
                                backgroundColor: "rgba(221, 107, 86, 0.2)",
                                borderColor: "#d36b56",
                                borderWidth: 2,
                                tension: 0.4,
                            },
                        ],
                    });
                }

            } catch (error) {
                console.error("Error fetching chart data:", error);
            }
        };

        fetchData();
    }, [endpoint, title]);

    return (
        <div style={{ width: "100%", maxWidth: "1000px", margin: "2rem auto" }}>
            <Line 
                data={chartData} 
                options={{ 
                    responsive: true, 
                    plugins: { 
                        legend: { 
                            display: true, 
                            labels: {
                                font: {
                                    size: 14,
                                    family: "'Lateef', sans-serif",
                                    weight: "bold",
                                    color: "#5b3120"
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: title,
                            color: "#5b3120",
                            font: {
                                size: 24,
                                family: "'Lateef', sans-serif",
                                weight: "bold",
                            },
                            padding: {
                                top: 10,
                                bottom: 30
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                color: "#5b3120",
                                font: {
                                    size: 14,
                                    family: "'Lateef', sans-serif",
                                    weight: "bold",
                                }
                            },
                            grid: {
                                color: "rgba(91, 49, 32, 0.2)"
                            }
                        },
                        x: {
                            ticks: {
                                color: "#5b3120",
                                font: {
                                    size: 14,
                                    family: "'Lateef', sans-serif",
                                    weight: "bold",
                                },
                                maxRotation: 45,
                                minRotation: 30
                            },
                            grid: {
                                color: "rgba(91, 49, 32, 0.2)"
                            }
                        }
                    }
                }} 
            />
        </div>
    );

};

export default StatisticsChart;
