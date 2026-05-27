export const OFFLINE_CITIES = [
  { name: "Umuarama", stateName: "Paraná", stateSigla: "PR", lat: -23.7573, lng: -53.3155 },
  { name: "São Paulo", stateName: "São Paulo", stateSigla: "SP", lat: -23.5505, lng: -46.6333 },
  { name: "Curitiba", stateName: "Paraná", stateSigla: "PR", lat: -25.4284, lng: -49.2733 },
  { name: "Londrina", stateName: "Paraná", stateSigla: "PR", lat: -23.3040, lng: -51.1696 },
  { name: "Maringá", stateName: "Paraná", stateSigla: "PR", lat: -23.4209, lng: -51.9331 },
  { name: "Cascavel", stateName: "Paraná", stateSigla: "PR", lat: -24.9578, lng: -53.4597 },
  { name: "Foz do Iguaçu", stateName: "Paraná", stateSigla: "PR", lat: -25.5477, lng: -54.5881 },
  { name: "Ponta Grossa", stateName: "Paraná", stateSigla: "PR", lat: -25.0945, lng: -50.1633 },
  { name: "Guarapuava", stateName: "Paraná", stateSigla: "PR", lat: -25.3951, lng: -51.4622 },
  { name: "Paranaguá", stateName: "Paraná", stateSigla: "PR", lat: -25.5205, lng: -48.5093 },
  { name: "Toledo", stateName: "Paraná", stateSigla: "PR", lat: -24.7149, lng: -53.7424 },
  { name: "Apucarana", stateName: "Paraná", stateSigla: "PR", lat: -23.5524, lng: -51.4619 },
  { name: "Arapongas", stateName: "Paraná", stateSigla: "PR", lat: -23.4190, lng: -51.4240 },
  { name: "Campo Mourão", stateName: "Paraná", stateSigla: "PR", lat: -24.0438, lng: -52.3792 },
  { name: "Paranavaí", stateName: "Paraná", stateSigla: "PR", lat: -23.0822, lng: -52.4639 },
  { name: "Pato Branco", stateName: "Paraná", stateSigla: "PR", lat: -26.2289, lng: -52.6713 },
  { name: "Francisco Beltrão", stateName: "Paraná", stateSigla: "PR", lat: -26.0792, lng: -53.0538 },
  { name: "Cianorte", stateName: "Paraná", stateSigla: "PR", lat: -23.6622, lng: -52.6074 },
  { name: "Telêmaco Borba", stateName: "Paraná", stateSigla: "PR", lat: -24.3236, lng: -50.6150 },
  { name: "Castro", stateName: "Paraná", stateSigla: "PR", lat: -24.7925, lng: -50.0125 },
  { name: "Rio de Janeiro", stateName: "Rio de Janeiro", stateSigla: "RJ", lat: -22.9068, lng: -43.1729 },
  { name: "Belo Horizonte", stateName: "Minas Gerais", stateSigla: "MG", lat: -19.9167, lng: -43.9345 },
  { name: "Brasília", stateName: "Distrito Federal", stateSigla: "DF", lat: -15.7801, lng: -47.9292 },
  { name: "Porto Alegre", stateName: "Rio Grande do Sul", stateSigla: "RS", lat: -30.0346, lng: -51.2177 },
  { name: "Florianópolis", stateName: "Santa Catarina", stateSigla: "SC", lat: -27.5954, lng: -48.5480 },
  { name: "Salvador", stateName: "Bahia", stateSigla: "BA", lat: -12.9777, lng: -38.5016 },
  { name: "Recife", stateName: "Pernambuco", stateSigla: "PE", lat: -8.0578, lng: -34.8829 },
  { name: "Fortaleza", stateName: "Ceará", stateSigla: "CE", lat: -3.7319, lng: -38.5267 },
  { name: "Goiânia", stateName: "Goiás", stateSigla: "GO", lat: -16.6869, lng: -49.2648 }
];

export const getNearestOfflineCity = (lat: number, lng: number) => {
  let nearest = OFFLINE_CITIES[0];
  let minDistance = Infinity;

  for (const city of OFFLINE_CITIES) {
    const dLat = city.lat - lat;
    const dLng = city.lng - lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }
  return nearest;
};

export const BRAZILIAN_STATES: { [key: string]: { name: string, sigla: string } } = {
  'acre': { name: 'Acre', sigla: 'AC' }, 'ac': { name: 'Acre', sigla: 'AC' },
  'alagoas': { name: 'Alagoas', sigla: 'AL' }, 'al': { name: 'Alagoas', sigla: 'AL' },
  'amapá': { name: 'Amapá', sigla: 'AP' }, 'ap': { name: 'Amapá', sigla: 'AP' },
  'amazonas': { name: 'Amazonas', sigla: 'AM' }, 'am': { name: 'Amazonas', sigla: 'AM' },
  'bahia': { name: 'Bahia', sigla: 'BA' }, 'ba': { name: 'Bahia', sigla: 'BA' },
  'ceará': { name: 'Ceará', sigla: 'CE' }, 'ce': { name: 'Ceará', sigla: 'CE' },
  'distrito federal': { name: 'Distrito Federal', sigla: 'DF' }, 'df': { name: 'Distrito Federal', sigla: 'DF' },
  'espírito santo': { name: 'Espírito Santo', sigla: 'ES' }, 'es': { name: 'Espírito Santo', sigla: 'ES' },
  'goiás': { name: 'Goiás', sigla: 'GO' }, 'go': { name: 'Goiás', sigla: 'GO' },
  'maranhão': { name: 'Maranhão', sigla: 'MA' }, 'ma': { name: 'Maranhão', sigla: 'MA' },
  'mato grosso': { name: 'Mato Grosso', sigla: 'MT' }, 'mt': { name: 'Mato Grosso', sigla: 'MT' },
  'mato grosso do sul': { name: 'Mato Grosso do Sul', sigla: 'MS' }, 'ms': { name: 'Mato Grosso do Sul', sigla: 'MS' },
  'minas gerais': { name: 'Minas Gerais', sigla: 'MG' }, 'mg': { name: 'Minas Gerais', sigla: 'MG' },
  'pará': { name: 'Pará', sigla: 'PA' }, 'pa': { name: 'Pará', sigla: 'PA' },
  'paraíba': { name: 'Paraíba', sigla: 'PB' }, 'pb': { name: 'Paraíba', sigla: 'PB' },
  'paraná': { name: 'Paraná', sigla: 'PR' }, 'pr': { name: 'Paraná', sigla: 'PR' },
  'pernambuco': { name: 'Pernambuco', sigla: 'PE' }, 'pe': { name: 'Pernambuco', sigla: 'PE' },
  'piauí': { name: 'Piauí', sigla: 'PI' }, 'pi': { name: 'Piauí', sigla: 'PI' },
  'rio de janeiro': { name: 'Rio de Janeiro', sigla: 'RJ' }, 'rj': { name: 'Rio de Janeiro', sigla: 'RJ' },
  'rio grande do norte': { name: 'Rio Grande do Norte', sigla: 'RN' }, 'rn': { name: 'Rio Grande do Norte', sigla: 'RN' },
  'rio grande do sul': { name: 'Rio Grande do Sul', sigla: 'RS' }, 'rs': { name: 'Rio Grande do Sul', sigla: 'RS' },
  'rondônia': { name: 'Rondônia', sigla: 'RO' }, 'ro': { name: 'Rondônia', sigla: 'RO' },
  'roraima': { name: 'Roraima', sigla: 'RR' }, 'rr': { name: 'Roraima', sigla: 'RR' },
  'santa catarina': { name: 'Santa Catarina', sigla: 'SC' }, 'sc': { name: 'Santa Catarina', sigla: 'SC' },
  'são paulo': { name: 'São Paulo', sigla: 'SP' }, 'sp': { name: 'São Paulo', sigla: 'SP' },
  'sergipe': { name: 'Sergipe', sigla: 'SE' }, 'se': { name: 'Sergipe', sigla: 'SE' },
  'tocantins': { name: 'Tocantins', sigla: 'TO' }, 'to': { name: 'Tocantins', sigla: 'TO' }
};

export const formatLocation = (locationStr: string | undefined): string => {
  if (!locationStr) return "Região Desconhecida";

  // Check if location contains latitude and longitude coordinates and resolve offline immediately
  const coordRegex = /lat:\s*(-?\d+(\.\d+)?).*?lng:\s*(-?\d+(\.\d+)?)/i;
  const match = locationStr.match(coordRegex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[3]);
    const nearest = getNearestOfflineCity(lat, lng);
    return `${nearest.name}, ${nearest.stateSigla}`;
  }

  const parts = locationStr.split(',').map(p => p.trim());
  
  // 1. Find state index
  let foundStateObj: { name: string, sigla: string } | null = null;
  let stateIdx = -1;
  for (let i = 0; i < parts.length; i++) {
    const lower = parts[i].toLowerCase();
    if (BRAZILIAN_STATES[lower]) {
      foundStateObj = BRAZILIAN_STATES[lower];
      stateIdx = i;
      break;
    }
  }
  
  if (stateIdx !== -1 && foundStateObj) {
    // 2. The city is one of the parts preceding the state
    const precedingParts = parts.slice(0, stateIdx);
    
    const candidateCities = precedingParts.filter(part => {
      const lower = part.toLowerCase();
      
      // Exclude street prefixes
      if (
        lower.startsWith('rua ') || 
        lower.startsWith('r.') ||
        lower.startsWith('av.') || 
        lower.startsWith('avenida') || 
        lower.startsWith('travessa') || 
        lower.startsWith('tv.') || 
        lower.startsWith('alameda') || 
        lower.startsWith('al.') || 
        lower.startsWith('praça') || 
        lower.startsWith('parque') || 
        lower.startsWith('rodovia') || 
        lower.startsWith('rod.') ||
        lower.startsWith('beco') ||
        lower.startsWith('condomínio') ||
        lower.startsWith('jardim') ||
        lower.startsWith('jd.') ||
        lower.startsWith('bairro') ||
        lower.startsWith('loteamento')
      ) return false;
      
      // Exclude statistical regions
      if (
        lower.includes('região') || 
        lower.includes('microrregião') || 
        lower.includes('mesorregião') || 
        lower.includes('metropolitana')
      ) return false;
      
      // Exclude numeric / postal codes
      if (/^\d+/.test(lower) || /-\d+$/.test(lower)) return false;
      
      return true;
    });
    
    if (candidateCities.length > 0) {
      const city = candidateCities[candidateCities.length - 1];
      return `${city}, ${foundStateObj.sigla}`;
    }
  }
  
  // Fallback if state is not found
  if (parts.length >= 2) {
    const firstLower = parts[0].toLowerCase();
    const isStreet = firstLower.startsWith('rua') || firstLower.startsWith('r.') || firstLower.startsWith('av') || firstLower.startsWith('travessa') || firstLower.startsWith('tv.') || firstLower.startsWith('alameda');
    const startIdx = isStreet ? 1 : 0;
    
    const city = parts[startIdx];
    const state = parts[startIdx + 1] || '';
    if (state) {
      const stateKey = state.toLowerCase();
      const displayStateSigla = BRAZILIAN_STATES[stateKey]?.sigla || state;
      return `${city}, ${displayStateSigla}`;
    }
    return city;
  }
  
  return locationStr;
};

export const extractBasicCity = (locationStr: string | undefined): string => {
  if (!locationStr) return "";

  const coordRegex = /lat:\s*(-?\d+(\.\d+)?).*?lng:\s*(-?\d+(\.\d+)?)/i;
  const match = locationStr.match(coordRegex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[3]);
    const nearest = getNearestOfflineCity(lat, lng);
    return nearest.name.toLowerCase();
  }

  const parts = locationStr.split(',').map(p => p.trim());
  
  let foundState = "";
  let stateIdx = -1;
  for (let i = 0; i < parts.length; i++) {
    const lower = parts[i].toLowerCase();
    if (BRAZILIAN_STATES[lower]) {
      foundState = BRAZILIAN_STATES[lower].name;
      stateIdx = i;
      break;
    }
  }
  
  if (stateIdx !== -1) {
    const precedingParts = parts.slice(0, stateIdx);
    const candidateCities = precedingParts.filter(part => {
      const lower = part.toLowerCase();
      if (
        lower.startsWith('rua ') || 
        lower.startsWith('r.') ||
        lower.startsWith('av.') || 
        lower.startsWith('avenida') || 
        lower.startsWith('travessa') || 
        lower.startsWith('tv.') || 
        lower.startsWith('alameda') || 
        lower.startsWith('al.') || 
        lower.startsWith('praça') || 
        lower.startsWith('parque') || 
        lower.startsWith('rodovia') || 
        lower.startsWith('rod.') ||
        lower.startsWith('beco') ||
        lower.startsWith('condomínio') ||
        lower.startsWith('jardim') ||
        lower.startsWith('jd.') ||
        lower.startsWith('bairro') ||
        lower.startsWith('loteamento')
      ) return false;
      if (
        lower.includes('região') || 
        lower.includes('microrregião') || 
        lower.includes('mesorregião') || 
        lower.includes('metropolitana')
      ) return false;
      if (/^\d+/.test(lower) || /-\d+$/.test(lower)) return false;
      return true;
    });
    
    if (candidateCities.length > 0) {
      return candidateCities[candidateCities.length - 1].toLowerCase();
    }
  }
  
  if (parts.length >= 2) {
    const firstLower = parts[0].toLowerCase();
    const isStreet = firstLower.startsWith('rua') || firstLower.startsWith('r.') || firstLower.startsWith('av') || firstLower.startsWith('travessa') || firstLower.startsWith('tv.') || firstLower.startsWith('alameda');
    const startIdx = isStreet ? 1 : 0;
    return parts[startIdx].toLowerCase();
  }
  
  return locationStr.toLowerCase();
};
