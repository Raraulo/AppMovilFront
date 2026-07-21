import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

export interface PerfumeData {
  nombre: string;
  marca: string;
  anio: number;
  familia: string;
  notas_salida: string[];
  notas_corazon: string[];
  notas_fondo: string[];
  longevidad: string;
  intensidad: string;
  temporada: string;
  genero: string;
  publico: string;
  descripcion: string;
  piramide: {
    salida: number;
    corazon: number;
    fondo: number;
  };
  radar: {
    [key: string]: number;
  };
  calificacion_promedio: number;
  similares: string[];
}

interface Props {
  data: PerfumeData;
}

const RadarChart = ({ data }: { data: { [key: string]: number } }) => {
  const size = 260;
  const center = size / 2;
  const radius = center - 50;
  
  const keys = Object.keys(data);
  const numPoints = keys.length;
  if (numPoints === 0) return null;

  const getCoordinatesForAngle = (angle: number, value: number) => {
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle - Math.PI / 2);
    const y = center + r * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };

  // Draw background webs
  const levels = [20, 40, 60, 80, 100];
  const webs = levels.map(level => {
    const points = keys.map((_, i) => {
      const angle = (Math.PI * 2 * i) / numPoints;
      const { x, y } = getCoordinatesForAngle(angle, level);
      return `${x},${y}`;
    }).join(' ');
    return <Polygon key={`web-${level}`} points={points} stroke="#EDE8DF" strokeWidth="1" fill="none" />;
  });

  // Draw axes and labels
  const axes = keys.map((key, i) => {
    const angle = (Math.PI * 2 * i) / numPoints;
    const end = getCoordinatesForAngle(angle, 100);
    const labelPos = getCoordinatesForAngle(angle, 130);
    return (
      <React.Fragment key={`axis-${key}`}>
        <Line x1={center} y1={center} x2={end.x} y2={end.y} stroke="#EDE8DF" strokeWidth="1" />
        <SvgText
          x={labelPos.x}
          y={labelPos.y}
          fill="#999"
          fontSize="9"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {key}
        </SvgText>
      </React.Fragment>
    );
  });

  // Draw data polygon
  const dataPoints = keys.map((key, i) => {
    const angle = (Math.PI * 2 * i) / numPoints;
    const { x, y } = getCoordinatesForAngle(angle, data[key] || 0);
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size}>
        {webs}
        {axes}
        <Polygon points={dataPoints} fill="rgba(201, 168, 76, 0.3)" stroke="#C9A84C" strokeWidth="2" />
        {keys.map((key, i) => {
           const angle = (Math.PI * 2 * i) / numPoints;
           const { x, y } = getCoordinatesForAngle(angle, data[key] || 0);
           return <Circle key={`dot-${key}`} cx={x} cy={y} r="3" fill="#1A1A1A" />;
        })}
      </Svg>
    </View>
  );
};

const OlfactoryPyramid = ({ salida, corazon, fondo }: { salida: string[], corazon: string[], fondo: string[] }) => {
  return (
    <View style={styles.pyramidContainer}>
      <View style={[styles.pyramidLayer, { width: '50%', backgroundColor: '#F8F4EC' }]}>
        <Text style={styles.pyramidTitle}>SALIDA (Top)</Text>
        <Text style={styles.pyramidText}>{salida.join(', ')}</Text>
      </View>
      <View style={[styles.pyramidLayer, { width: '75%', backgroundColor: '#F5EBE1' }]}>
        <Text style={styles.pyramidTitle}>CORAZÓN (Heart)</Text>
        <Text style={styles.pyramidText}>{corazon.join(', ')}</Text>
      </View>
      <View style={[styles.pyramidLayer, { width: '100%', backgroundColor: '#EFE3D4' }]}>
        <Text style={styles.pyramidTitle}>FONDO (Base)</Text>
        <Text style={styles.pyramidText}>{fondo.join(', ')}</Text>
      </View>
    </View>
  );
};

export default function PerfumeAnalysisCard({ data }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.brand}>{data.marca.toUpperCase()}</Text>
        <Text style={styles.name}>{data.nombre}</Text>
        <Text style={styles.subtitle}>{data.familia} • {data.anio}</Text>
      </View>
      
      <Text style={styles.description}>{data.descripcion}</Text>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Longevidad</Text>
          <Text style={styles.gridValue}>{data.longevidad}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Intensidad</Text>
          <Text style={styles.gridValue}>{data.intensidad}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Temporada</Text>
          <Text style={styles.gridValue}>{data.temporada}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Público</Text>
          <Text style={styles.gridValue}>{data.publico}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perfil Olfativo</Text>
        <RadarChart data={data.radar} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pirámide de Notas</Text>
        <OlfactoryPyramid salida={data.notas_salida} corazon={data.notas_corazon} fondo={data.notas_fondo} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Similares</Text>
        <View style={styles.tagsRow}>
          {data.similares.map((sim, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{sim}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE8DF',
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10,
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brand: {
    fontSize: 12,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    letterSpacing: 1.5,
    color: '#999',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#C9A84C',
    marginTop: 6,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#EDE8DF',
    marginBottom: 24,
  },
  gridItem: {
    width: '50%',
    padding: 12,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EDE8DF',
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontFamily: 'PlayfairDisplay_600SemiBold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pyramidContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  pyramidLayer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pyramidTitle: {
    fontSize: 10,
    color: '#999',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pyramidText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F5F0EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#1A1A1A',
  },
});
