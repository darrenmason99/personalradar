import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { technologyApi, Technology } from '../services/api';
import { CircularProgress, Box } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarProps {
  width?: number;
  height?: number;
}

const QUADRANTS = [
  'Techniques',
  'Tools',
  'Platforms',
  'Languages & Frameworks'
];

const RINGS = ['Adopt', 'Trial', 'Assess', 'Hold'];

const RING_COLORS = {
  'Adopt': 'rgba(75, 192, 192, 0.6)',
  'Trial': 'rgba(54, 162, 235, 0.6)',
  'Assess': 'rgba(255, 206, 86, 0.6)',
  'Hold': 'rgba(255, 99, 132, 0.6)'
};

const RadarChart: React.FC<RadarProps> = ({ width = 600, height = 600 }) => {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTechnologies = async () => {
      try {
        const response = await technologyApi.list();
        setTechnologies(response);
      } catch (error) {
        console.error('Error fetching technologies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnologies();
  }, []);

  const processData = () => {
    const datasets = RINGS.map(ring => {
      const data = QUADRANTS.map(quadrant => {
        return technologies.filter(tech => 
          tech.quadrant === quadrant && tech.ring === ring
        ).length;
      });

      return {
        label: ring,
        data: data,
        backgroundColor: RING_COLORS[ring as keyof typeof RING_COLORS],
        borderColor: RING_COLORS[ring as keyof typeof RING_COLORS].replace('0.6', '1'),
        borderWidth: 1,
        pointBackgroundColor: RING_COLORS[ring as keyof typeof RING_COLORS].replace('0.6', '1'),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: RING_COLORS[ring as keyof typeof RING_COLORS].replace('0.6', '1'),
      };
    });

    return {
      labels: QUADRANTS,
      datasets: datasets,
    };
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(128, 128, 128, 0.2)',
        },
        suggestedMin: 0,
        suggestedMax: Math.max(...technologies.map(t => 
          technologies.filter(tech => tech.quadrant === t.quadrant && tech.ring === t.ring).length
        ), 1),
        ticks: {
          display: false,
        },
        pointLabels: {
          font: {
            size: 14,
            weight: 'bold' as const,
          },
          color: '#333',
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const quadrant = context.label;
            const ring = context.dataset.label;
            const count = context.raw;
            const techs = technologies.filter(t => t.quadrant === quadrant && t.ring === ring);
            return [
              `${ring} - ${count} technologies`,
              ...techs.map(t => `• ${t.name}`)
            ];
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box width={width} height={height}>
      <Radar data={processData()} options={options} />
    </Box>
  );
};

export default RadarChart; 