import React, { useState } from 'react';
import ReactJson from 'react-json-view';
import './App.css';
import { FaSave, FaFileUpload, FaGlobe } from 'react-icons/fa';


function correctFrench(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\bpartciper\b/g, 'participer')
    .replace(/\btempete\b/g, 'tempête')
    .replace(/\bcalmee\b/g, 'calmée')
    .replace(/\bdommagee\b/g, 'endommagée')
    .replace(/\brestaurer\b/g, 'restaurer')
    .replace(/\bserieux\b/g, 'sérieux')
    .replace(/\bpoids\b/g, 'poids')
    .replace(/\bparticipez\b/g, 'participez');
}

function correctFrenchFields(obj) {
  if (Array.isArray(obj)) {
    return obj.map(correctFrenchFields);
  } else if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (key === 'fr' && typeof obj[key] === 'string') {
        newObj[key] = correctFrench(obj[key]);
      } else {
        newObj[key] = correctFrenchFields(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

function App() {
  const [jsonData, setJsonData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('fr');
  const [message, setMessage] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let data = JSON.parse(event.target.result);
        // Correction automatique des champs FR
        data = correctFrenchFields(data);
        setJsonData(data);
        setMessage('✅ Fichier chargé et corrigé !');
        setTimeout(() => setMessage(''), 2000);
      } catch (err) {
        setMessage('❌ Erreur de parsing JSON : ' + err.message);
        setTimeout(() => setMessage(''), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleEdit = (edit) => {
    setJsonData(edit.updated_src);
  };

  // Filtrage du JSON selon la recherche
  function filterJson(data, query) {
    if (!query || !data) return data;
    const q = query.toLowerCase();
    if (Array.isArray(data)) {
      return data.filter(obj => JSON.stringify(obj).toLowerCase().includes(q));
    }
    if (typeof data === 'object') {
      return Object.fromEntries(
        Object.entries(data).filter(([k, v]) =>
          k.toLowerCase().includes(q) ||
          (typeof v === 'string' && v.toLowerCase().includes(q))
        )
      );
    }
    return data;
  }

  // Filtre les champs selon la langue sélectionnée
  function filterLangFields(data, lang) {
    if (!data) return data;
    if (Array.isArray(data)) {
      return data.map(obj => filterLangFields(obj, lang));
    }
    if (typeof data === 'object' && data !== null) {
      const newObj = {};
      for (const key in data) {
        if (typeof data[key] === 'object' && data[key] !== null && lang in data[key]) {
          newObj[key] = data[key][lang];
        } else {
          newObj[key] = filterLangFields(data[key], lang);
        }
      }
      return newObj;
    }
    return data;
  }

  const handleSave = () => {
    if (!jsonData) return;
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'data.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('💾 Fichier exporté !');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className="editor-bg">
      <header className="arc-header">
        <img src="/Logo_Arc_Raiders.png" alt="Arc Raiders" className="arc-logo" />
      </header>
      <div className="editor-card">
        <h2 className="editor-title"><FaGlobe style={{marginRight:8}}/> Éditeur JSON Multilingue</h2>
        <label className="editor-label">
          <span><FaFileUpload style={{marginRight:6}}/> Charger un fichier JSON :</span>
          <input type="file" accept=".json" onChange={handleFileChange} className="editor-input" />
        </label>
        {message && <div className="editor-message">{message}</div>}
        {jsonData && (
          <>
            <div className="editor-actions">
              <button className="editor-btn" onClick={handleSave}><FaSave style={{marginRight:6}}/>Exporter</button>
            </div>
            <div style={{ width: '100%', marginBottom: 16, display: 'flex', gap: 12 }}>
              <input
                type="text"
                className="editor-input"
                placeholder="Rechercher dans le JSON..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '70%' }}
              />
              <select
                className="editor-input"
                value={lang}
                onChange={e => setLang(e.target.value)}
                style={{ width: '30%' }}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
                <option value="pt">Português</option>
                <option value="pl">Polski</option>
                <option value="it">Italiano</option>
                <option value="ru">Русский</option>
                <option value="zh-CN">中文(简体)</option>
                <option value="ja">日本語</option>
                <option value="tr">Türkçe</option>
                <option value="uk">Українська</option>
                <option value="kr">한국어</option>
                <option value="da">Dansk</option>
                <option value="no">Norsk</option>
                <option value="zh-TW">中文(繁體)</option>
                <option value="sr">Српски</option>
                <option value="hr">Hrvatski</option>
              </select>
            </div>
            <div className="json-view">
              <ReactJson
                src={
                  selectedId
                    ? filterJson(filterLangFields(jsonData, lang), search).filter(obj => obj && (obj.id === selectedId || obj.name === selectedId))
                    : filterJson(filterLangFields(jsonData, lang), search)
                }
                onEdit={handleEdit}
                onAdd={handleEdit}
                onDelete={handleEdit}
                name={null}
                collapsed={false}
                enableClipboard={true}
                displayDataTypes={false}
                displayObjectSize={false}
                theme="monokai"
                style={{ fontSize: 15, borderRadius: 8, padding: 16 }}
              />
            </div>
            {selectedId && (
              <div style={{textAlign:'center',margin:'12px 0'}}>
                <button className="editor-btn" onClick={()=>setSelectedId(null)}>Afficher tout</button>
              </div>
            )}
            <div style={{marginTop: '24px'}}>
              <ImagePreview 
                data={filterJson(filterLangFields(jsonData, lang), search)} 
                onImageClick={id => setSelectedId(id)} 
              />
            </div>
          </>
        )}
      </div>
      <footer className="arc-footer">ArcRaiders Editor &copy; 2025</footer>
    </div>
  );
}

// Composant d'aperçu d'images à partir du champ imageFilename
function ImagePreview({ data, onImageClick }) {
  let images = [];
  if (Array.isArray(data)) {
    images = data.filter(obj => obj && obj.imageFilename).map(obj => ({src: obj.imageFilename, name: obj.name || obj.id || '', id: obj.id || obj.name || ''}));
  } else if (data && typeof data === 'object' && data.imageFilename) {
    images = [{src: data.imageFilename, name: data.name || data.id || '', id: data.id || data.name || ''}];
  }
  if (images.length === 0) return null;
  return (
    <div className="arc-image-gallery">
      {images.map((img, i) => (
        <div key={i} className="arc-image-item" onClick={()=>onImageClick && onImageClick(img.id)} style={{cursor:'pointer'}}>
          <img src={img.src} alt="Aperçu" className="arc-image" />
          {img.name && <div className="arc-image-label">{img.name}</div>}
        </div>
      ))}
    </div>
  );
}

export default App;
