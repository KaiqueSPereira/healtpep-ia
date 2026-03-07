'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Ruler, ArrowUp, ArrowDown, Minus } from 'lucide-react';

// TIPOS
interface PesoRegistro {
  id: string;
  peso: string;
  data: string;
  pescoco?: string | null;
  torax?: string | null;
  cintura?: string | null;
  quadril?: string | null;
  bracoE?: string | null;
  bracoD?: string | null;
  pernaE?: string | null;
  pernaD?: string | null;
  pantE?: string | null;
  pantD?: string | null;
}

interface BodyMeasurementChartProps {
  historicoPeso: PesoRegistro[];
}

type BodyPartName = 'pescoco' | 'torax' | 'cintura' | 'quadril' | 'bracoE' | 'bracoD' | 'pernaE' | 'pernaD' | 'pantE' | 'pantD';

const measurementKeys: BodyPartName[] = ['pescoco', 'torax', 'cintura', 'quadril', 'bracoE', 'bracoD', 'pernaE', 'pernaD', 'pantE', 'pantD'];

// Caminho da silhueta principal, extraído dos seus arquivos SVG
const masterPath = "M286.166,286.154c-1.301-1.601-3.927-7.737-5.1-9.769-1.172-2.032-5.549-8.89-8.91-12.094-.829-.791-1.663-1.355-2.449-1.757-2.431-5.577-5.384-28.014-7.046-45.077-1.758-18.054-7.503-25.205-7.503-25.205.821-14.771-4.103-30.129-3.947-33.763.156-3.634,0-14.967,0-14.967-.86-18.601-10.707-22.196-21.414-25.635-10.707-3.439-23.759-10.004-25.713-11.723-1.954-1.719-1.954-4.533-2.032-9.144-.076-4.462,1.823-9.218,3.362-14.618,4.144-.098,6.586-12.54,4.531-13.674-.742-.409-1.298-.441-1.713-.299.651-6.329.378-13.456-2.664-19.005-5.783-10.551-17.038-10.16-17.038-10.16h-.987s-11.254-.391-17.038,10.16c-3.042,5.549-3.315,12.676-2.664,19.005-.414-.141-.971-.11-1.712.299-2.055,1.134.388,13.575,4.531,13.674,1.539,5.401,3.438,10.157,3.362,14.618-.078,4.611-.078,7.425-2.032,9.144-1.954,1.719-15.006,8.284-25.713,11.723s-20.555,7.034-21.414,25.635c0,0-.156,11.333,0,14.967.156,3.634-4.767,18.992-3.947,33.763,0,0-5.744,7.151-7.503,25.205-1.662,17.064-4.616,39.5-7.046,45.077-.786.402-1.62.966-2.45,1.757-3.361,3.204-7.737,10.062-8.91,12.094s-3.798,8.168-5.1,9.769c-1.524,1.876-1.315,4.643,1.407,3.341,2.696-1.29,5.412-4.435,6.506-6.311,1.094-1.876,1.876-2.345,1.876-2.345,0,0-1.454,12.29-1.859,16.023-.449,4.142-2.009,9.807.14,10.393,2.362.644,2.97-2.501,3.361-4.924.391-2.423,2.816-14.069,3.587-14.771.96-.875.538.482.321,3.282-.073.948-.391,5.705-.86,8.753-.469,3.048-2.032,9.848,1.251,9.457,3.282-.391,4.064-18.757,4.611-20.086.547-1.329,1.016-.781.703,2.501-.099,1.038-1.798,13.364-1.172,15.865.625,2.501,3.048,2.11,3.83-1.094.781-3.204,1.563-16.178,2.11-17.116.547-.938.703.782.547,3.126-.115,1.716-1.094,11.098.782,11.489,1.876.391,2.638-.762,3.158-7.62.456-6.005.515-9.34.828-13.169.313-3.83.703-15.084-1.172-18.523,0,0,2.345-11.567,7.19-21.571,4.846-10.004,12.036-27.511,11.723-36.108-.26-7.139,5.732-31.953,7.951-40.344.21,2.092.517,4.307.959,6.581,2.188,11.254,5.471,24.853,5.002,33.294-.469,8.441-1.407,21.258-2.345,26.26-.938,5.002-6.565,24.384-6.409,48.3s3.439,52.129,5.002,58.069c1.563,5.94,2.013,11.827,1.544,15.891-.469,4.064-1.388,13.104-.45,19.2,0,0-3.751,15.944-.781,37.671,2.97,21.727,8.284,45.642,8.284,48.143v.994c-.255,1.166-.539,2.326-.795,3.493-.31,1.41-.518,2.82-.557,4.266-.038,1.429.042,2.854.067,4.282.017,1.001-.01,2.002-.107,2.995-.718,1.458-1.584,2.86-2.472,4.201-1.205,1.82-2.568,3.53-3.954,5.215-1.399,1.7-2.827,3.378-4.161,5.13-.663.871-1.303,1.76-1.903,2.676-.626.955-1.333,1.959-1.556,3.1-.206,1.052.093,2.114,1.095,2.615.2.1.412.163.625.191-.027.322-.008.652.085.992.34,1.245,1.607,2.14,2.882,2.176.173.594.609,1.045,1.286,1.238.829.237,1.729-.011,2.469-.44.037.19.098.376.19.555.462.903,1.493,1.29,2.462,1.26,1.146-.035,2.117-.709,2.88-1.518.395-.419.753-.867,1.111-1.314-.15.603-.164,1.232.06,1.819.417,1.093,1.605,1.644,2.697,1.799,1.036.147,2.083-.06,3.016-.526.357-.179.724-.407,1.064-.674.638-.314,1.219-.769,1.716-1.262,1.103-1.095,1.864-2.457,2.437-3.89,1.27-3.171,1.679-6.616,2.341-9.945.125-.626.254-1.258.398-1.888.082.057.213.05.325-.063,1.422-1.443,1.97-3.776,2.14-5.729.208-2.395-.156-4.784-.6-7.132-.47-2.492-.935-4.975-1.23-7.496-.294-2.518-.456-5.049-.576-7.581-.066-1.391-.126-2.783-.185-4.175-.004-.102-.01-.204-.015-.306.285-3.865.614-7.629.988-10.847,1.563-13.443,7.034-35.795,5.627-47.362-1.407-11.567.307-41.109,1.797-49.55,1.49-8.441,8.675-55.959,7.112-69.558l1.744-.158,1.744.158c-1.563,13.599,5.622,61.117,7.112,69.558,1.49,8.441,3.204,37.983,1.797,49.55s4.064,33.919,5.627,47.362c.374,3.218.703,6.982.988,10.847-.005.102-.011.204-.015.306-.06,1.392-.119,2.783-.185,4.175-.12,2.532-.282,5.063-.576,7.581-.294,2.521-.759,5.004-1.23,7.496-.443,2.348-.808,4.737-.6,7.132.17,1.953.718,4.287,2.14,5.729.112.113.242.12.325.063.143.63.273,1.262.398,1.888.663,3.329,1.072,6.775,2.341,9.945.574,1.432,1.334,2.795,2.437,3.89.497.493,1.078.949,1.716,1.262.34.267.706.495,1.064.674.932.466,1.979.673,3.016.526,1.092-.155,2.279-.707,2.697-1.799.224-.587.21-1.216.06-1.819.358.447.716.895,1.111,1.314.763.808,1.734,1.483,2.88,1.518.969.03,2-.357,2.462-1.26.091-.179.152-.365.19-.555.74.429,1.64.676,2.469.44.677-.193,1.114-.644,1.286-1.238,1.275-.036,2.542-.931,2.882-2.176.093-.34.112-.67.085-.992.213-.029.425-.091.625-.191,1.002-.5,1.301-1.562,1.095-2.615-.223-1.141-.93-2.145-1.556-3.1-.6-.916-1.24-1.805-1.903-2.676-1.334-1.753-2.762-3.43-4.161-5.13-1.386-1.685-2.749-3.394-3.954-5.215-.888-1.341-1.754-2.743-2.472-4.201-.096-.994-.124-1.994-.107-2.995.024-1.428.105-2.853.067-4.282-.039-1.445-.247-2.855-.557-4.266-.256-1.166-.539-2.326-.795-3.493v-.994c0-2.501,5.314-26.416,8.284-48.143,2.97-21.727-.782-37.671-.782-37.671.938-6.096.019-15.136-.45-19.2-.469-4.064-.019-9.951,1.544-15.891,1.563-5.94,4.846-34.154,5.002-58.069.156-23.915-5.471-43.298-6.409-48.3-.938-5.002-1.876-17.819-2.345-26.26-.469-8.441,2.813-22.04,5.002-33.294.442-2.274.748-4.489.959-6.581,2.219,8.391,8.21,33.205,7.951,40.344-.313,8.597,6.878,26.104,11.723,36.108s7.19,21.571,7.19,21.571c-1.876,3.439-1.485,14.693-1.172,18.523.313,3.83.372,7.164.828,13.169.52,6.858,1.282,8.011,3.158,7.62,1.876-.391.897-9.773.782-11.489-.157-2.345,0-4.064.547-3.126.547.938,1.329,13.912,2.11,17.116.782,3.204,3.204,3.595,3.83,1.094.625-2.501-1.073-14.827-1.172-15.865-.313-3.282.156-3.83.703-2.501.547,1.329,1.329,19.695,4.611,20.086s1.719-6.409,1.25-9.457c-.469-3.048-.786-7.805-.86-8.753-.217-2.8-.64-4.157.321-3.282.771.702,3.196,12.348,3.587-14.771.391-2.423.999,5.568,3.361,4.924,2.149-.586.589-6.251.14-10.393-.405-3.734-1.859-16.023-1.859-16.023,0,0,.782.469,1.876,2.345,1.094,1.876,3.81,5.021,6.506,6.311,2.722,1.302,2.931-1.466,1.407-3.341Z";

// Definições das máscaras (clip-paths), extraídas dos seus arquivos SVG
const clipPaths = {
  head: { id: 'clip_head', x: 130, y: 10, width: 116, height: 75 },
  neck: { id: 'clip_neck', x: 155, y: 82, width: 66, height: 30 },
  chest: { id: 'clip_chest', x: 120, y: 110, width: 136, height: 110 },
  abdomen: { id: 'clip_abdomen', x: 130, y: 218, width: 116, height: 90 },
  pelvis: { id: 'clip_pelvis', x: 130, y: 305, width: 116, height: 65 },
  left_arm: { id: 'clip_left_arm', x: 20, y: 108, width: 115, height: 220 },
  right_arm: { id: 'clip_right_arm', x: 241, y: 108, width: 115, height: 220 },
  left_thigh: { id: 'clip_left_thigh', x: 130, y: 365, width: 60, height: 100 },
  right_thigh: { id: 'clip_right_thigh', x: 186, y: 365, width: 60, height: 100 },
  left_leg: { id: 'clip_left_leg', x: 133, y: 460, width: 55, height: 75 },
  right_leg: { id: 'clip_right_leg', x: 188, y: 460, width: 55, height: 75 },
};

// SUB-COMPONENTE: Medida Individual
const Measurement = (props: { label: string; value?: string | null; prevValue?: string | null; align?: 'left' | 'right'; onMouseEnter: () => void; onMouseLeave: () => void; }) => {
    const { label, value, prevValue, align = 'left', onMouseEnter, onMouseLeave } = props;
    const currentValue = value ? parseFloat(value) : null;
    const previousValue = prevValue ? parseFloat(prevValue) : null;
    const diff = currentValue !== null && previousValue !== null ? currentValue - previousValue : null;
  
    return (
      <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className={`${align === 'right' ? 'text-right' : 'text-left'} p-2 rounded-md transition-colors duration-200 hover:bg-muted/50 grow flex flex-col justify-center`}>
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          {currentValue === null || isNaN(currentValue) ? (
            <div className="text-lg font-semibold text-muted-foreground">-</div>
          ) : (
            <div className={`flex items-baseline gap-2 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
              {align === 'right' && diff !== null && !isNaN(diff) && <span className={`flex items-center text-xs font-semibold ${diff < 0 ? 'text-green-500' : diff > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>{Math.abs(diff).toFixed(1)}{diff !== 0 && (diff < 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}</span>}
              <span className="text-xl font-bold">{currentValue.toFixed(1)}</span><span className="text-sm text-muted-foreground">cm</span>
              {align === 'left' && diff !== null && !isNaN(diff) && <span className={`flex items-center text-xs font-semibold ${diff < 0 ? 'text-green-500' : diff > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>{diff !== 0 && (diff < 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}{Math.abs(diff).toFixed(1)}</span>}
            </div>
          )}
        </div>
      </div>
    );
};

// SUB-COMPONENTE: Silhueta com Destaques
const BodySilhouette = ({ highlight }: { highlight: BodyPartName | null }) => {
  const isVisible = (parts: BodyPartName[]) => parts.some(p => p === highlight);

  return (
    <svg viewBox="0 0 376 545" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {Object.values(clipPaths).map(clip => (
          <clipPath id={clip.id} key={clip.id}>
            <rect x={clip.x} y={clip.y} width={clip.width} height={clip.height} />
          </clipPath>
        ))}
      </defs>

      {/* Camada Base */}
      <path d={masterPath} fill="currentColor" className="text-gray-300 dark:text-gray-700" />

      {/* Camadas de Destaque (invisíveis por padrão) */}
      <path d={masterPath} fill="currentColor" className="text-primary transition-opacity duration-300 ease-in-out" opacity={isVisible(['pescoco']) ? 0.5 : 0} clipPath={`url(#${clipPaths.head.id})`} />
      <path d={masterPath} fill="currentColor" className="text-primary transition-opacity duration-300 ease-in-out" opacity={isVisible(['pescoco']) ? 0.5 : 0} clipPath={`url(#${clipPaths.neck.id})`} />
      <path d={masterPath} fill="currentColor" className="text-primary transition-opacity duration-300 ease-in-out" opacity={isVisible(['torax']) ? 0.5 : 0} clipPath={`url(#${clipPaths.chest.id})`} />
      <path d={masterPath} fill="currentColor" className="text-primary transition-opacity duration-300 ease-in-out" opacity={isVisible(['cintura']) ? 0.5 : 0} clipPath={`url(#${clipPaths.abdomen.id})`} />
      <path d={masterPath} fill="currentColor" className="text-primary transition-opacity duration-300 ease-in-out" opacity={isVisible(['quadril']) ? 0.5 : 0} clipPath={`url(#${clipPaths.pelvis.id})`} />
      <path d={masterPath} fill="currentColor" className="text-primary transition-opacity duration-300 ease-in-out" opacity={isVisible(['bracoE']) ? 0.5 : 0} clipPath={`url(#${clipPaths.left_arm.id})`} />
      <path d={masterPath} fill="currentColor" className="text-primary transition-opacity duration-300 ease-in-out" opacity={isVisible(['bracoD']) ? 0.5 : 0} clipPath={`url(#${clipPaths.right_arm.id})`} />
      <path d={masterPath} fill="currentColor" className="text-primary transition-opacity duration-300 ease-in-out" opacity={isVisible(['pernaE', 'pantE']) ? 0.5 : 0} clipPath={`url(#${clipPaths.left_thigh.id})`} />
      <path d={masterPath} fill="currentColor" className="text-primary transition-opacity duration-300 ease-in-out" opacity={isVisible(['pernaE', 'pantE']) ? 0.5 : 0} clipPath={`url(#${clipPaths.left_leg.id})`} />
      <path d={masterPath} fill="currentColor" className="text-primary transition-opacity duration-300 ease-in-out" opacity={isVisible(['pernaD', 'pantD']) ? 0.5 : 0} clipPath={`url(#${clipPaths.right_thigh.id})`} />
      <path d={masterPath} fill="currentColor" className="text-primary transition-opacity duration-300 ease-in-out" opacity={isVisible(['pernaD', 'pantD']) ? 0.5 : 0} clipPath={`url(#${clipPaths.right_leg.id})`} />
    </svg>
  );
};


// COMPONENTE PRINCIPAL
const BodyMeasurementChart = ({ historicoPeso }: BodyMeasurementChartProps) => {
  const [highlightedPart, setHighlightedPart] = useState<BodyPartName | null>(null);

  const { latest, previous } = useMemo(() => {
    const sortedData = [...historicoPeso]
      .filter(item => 
        measurementKeys.some(key => item[key] !== null && item[key] !== undefined && item[key] !== '')
      )
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return { latest: sortedData[0] || null, previous: sortedData[1] || null };
  }, [historicoPeso]);

  return (
    <Card className='h-full border-0 shadow-none'>
      <CardHeader>
        <CardTitle className='flex items-center text-lg'>
          <Ruler className="mr-2 h-5 w-5" />
          Medidas Corporais
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full p-0 sm:p-1">
        {!latest ? (
          <div className="flex h-full min-h-[450px] items-center justify-center text-muted-foreground">
            Nenhum registro de medidas encontrado.
          </div>
        ) : (
          <div className="grid h-full grid-cols-[1fr_1fr_1fr] items-stretch justify-items-stretch gap-x-1 min-h-[25rem]">
            {/* Coluna Esquerda */}
            <div className="flex flex-col h-full">
              <Measurement label="Tórax" value={latest.torax} prevValue={previous?.torax} align="right" onMouseEnter={() => setHighlightedPart('torax')} onMouseLeave={() => setHighlightedPart(null)} />
              <Measurement label="Braço E" value={latest.bracoE} prevValue={previous?.bracoE} align="right" onMouseEnter={() => setHighlightedPart('bracoE')} onMouseLeave={() => setHighlightedPart(null)} />
              <Measurement label="Cintura" value={latest.cintura} prevValue={previous?.cintura} align="right" onMouseEnter={() => setHighlightedPart('cintura')} onMouseLeave={() => setHighlightedPart(null)} />
              <Measurement label="Perna E" value={latest.pernaE} prevValue={previous?.pernaE} align="right" onMouseEnter={() => setHighlightedPart('pernaE')} onMouseLeave={() => setHighlightedPart(null)} />
              <Measurement label="Pant. E" value={latest.pantE} prevValue={previous?.pantE} align="right" onMouseEnter={() => setHighlightedPart('pantE')} onMouseLeave={() => setHighlightedPart(null)} />
            </div>

            {/* Coluna Central (SVG) */}
            <div className="h-full flex justify-center items-stretch">
              <BodySilhouette highlight={highlightedPart} />
            </div>

            {/* Coluna Direita */}
            <div className="flex flex-col h-full">
                <Measurement label="Pescoço" value={latest.pescoco} prevValue={previous?.pescoco} align="left" onMouseEnter={() => setHighlightedPart('pescoco')} onMouseLeave={() => setHighlightedPart(null)} />
                <Measurement label="Braço D" value={latest.bracoD} prevValue={previous?.bracoD} align="left" onMouseEnter={() => setHighlightedPart('bracoD')} onMouseLeave={() => setHighlightedPart(null)} />
                <Measurement label="Quadril" value={latest.quadril} prevValue={previous?.quadril} align="left" onMouseEnter={() => setHighlightedPart('quadril')} onMouseLeave={() => setHighlightedPart(null)} />
                <Measurement label="Perna D" value={latest.pernaD} prevValue={previous?.pernaD} align="left" onMouseEnter={() => setHighlightedPart('pernaD')} onMouseLeave={() => setHighlightedPart(null)} />
                <Measurement label="Pant. D" value={latest.pantD} prevValue={previous?.pantD} align="left" onMouseEnter={() => setHighlightedPart('pantD')} onMouseLeave={() => setHighlightedPart(null)} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BodyMeasurementChart;
