# Synergyatech - Calculadora Solar Colombia

## 📋 Descripción

Aplicación web profesional para el cálculo, diseño y cotización de sistemas fotovoltaicos en Colombia. Desarrollada específicamente para Synergyatech, integra las regulaciones locales, opciones de financiamiento y herramientas educativas para facilitar la adopción de energía solar.

## 🚀 Características Principales

### 1. **Calculadora Solar Avanzada**
- Dos métodos de cálculo: por dispositivos o por consumo mensual
- Comparación automática entre sistemas On-Grid y Off-Grid
- Cálculo detallado de componentes con precios actualizados
- Diagramas de conexión interactivos SVG

### 2. **Marco Regulatorio Completo**
- Enlaces directos a documentos oficiales (CREG, UPME, MinEnergía)
- Procedimiento paso a paso para conexión a red
- Información detallada sobre incentivos tributarios
- Recursos y enlaces a entidades reguladoras

### 3. **Curso de Energía Solar**
- 8 módulos estructurados con 32 lecciones
- Contenido desde nivel básico hasta avanzado
- Ejercicios prácticos incluidos
- Recursos descargables

### 4. **Análisis Financiero**
- Modo básico: cálculo rápido de financiamiento
- Modo avanzado: análisis con TIR, VPN, LCOE
- Comparador de opciones de financiamiento
- Análisis de sensibilidad

### 5. **Generador de Informes PDF**
- Informes profesionales con marca de agua
- Esquemas de conexión incluidos
- Análisis financiero completo
- Personalizable según tipo de proyecto

## 📁 Estructura de Archivos

```
solar-calculator/
│
├── index.html          # Archivo principal HTML
├── styles.css          # Estilos CSS
├── script.js           # Lógica JavaScript
└── README.md          # Este archivo
```

## 🛠️ Instalación

1. **Clonar o descargar los archivos**
   ```bash
   git clone https://github.com/synergyatech/solar-calculator.git
   ```

2. **Estructura local**
   - Crear una carpeta para el proyecto
   - Colocar los tres archivos (HTML, CSS, JS) en la misma carpeta
   - No se requieren instalaciones adicionales

3. **Abrir en navegador**
   - Abrir el archivo `index.html` en cualquier navegador moderno
   - Recomendado: Chrome, Firefox, Safari o Edge actualizado

## 🌐 Despliegue en GitHub Pages

1. **Crear repositorio en GitHub**
   - Nombre sugerido: `calculadora-solar`
   - Hacerlo público para usar GitHub Pages gratis

2. **Subir archivos**
   ```bash
   git add .
   git commit -m "Initial commit - Solar Calculator"
   git push origin main
   ```

3. **Activar GitHub Pages**
   - Ir a Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / root
   - Guardar y esperar el despliegue

4. **URL final**
   - La aplicación estará disponible en:
   - `https://[usuario].github.io/[repositorio]/`

## 📊 Fuentes de Datos

### Radiación Solar
- **Fuente principal**: Atlas de Radiación Solar de Colombia (IDEAM)
- **Valores promedio por departamento** (kWh/m²/día):
  - La Guajira: 5.5
  - Atlántico: 5.2
  - Cesar: 5.3
  - Norte de Santander: 4.8
  - Antioquia: 4.5
  - Bogotá D.C.: 4.2
  - [Lista completa en el código]

### Precios de Componentes (2024)
```javascript
const PRICES = {
    panel: 1500000,        // Panel 550W
    inverterOnGrid: 3000000,  // por kW
    inverterOffGrid: 4000000, // por kW  
    battery: 2000000,      // por kWh
    chargeController: 800000, // Controlador MPPT
    structure: 300000,     // por panel
    cabling: 50000,        // por panel
    protections: 500000,   // kit fijo
    installation: 0.3      // 30% del costo de equipos
};
```

### Factores de Cálculo
- **Eficiencia sistema On-Grid**: 85%
- **Eficiencia sistema Off-Grid**: 75%
- **Días de autonomía (Off-Grid)**: 3 días
- **Profundidad de descarga baterías**: 50%
- **Factor CO₂ Colombia**: 0.126 kg CO₂/kWh

## 💻 Uso de la Aplicación

### Calculadora Solar
1. **Seleccionar departamento** para obtener radiación solar precisa
2. **Ingresar tarifa eléctrica** del recibo de luz
3. **Elegir método de cálculo**:
   - Por equipos: seleccionar dispositivos con iconos intuitivos
   - Por consumo: ingresar kWh mensuales del recibo
4. **Calcular sistema** para ver comparación On-Grid vs Off-Grid

### Configuración de Dispositivos
- Click en el icono del dispositivo
- Configurar cantidad y horas de uso
- Sistema calcula consumo diario automáticamente
- Opción de agregar dispositivos personalizados

### Generación de Informes
1. Completar datos del cliente
2. Seleccionar tipo de sistema e instalación
3. Elegir componentes a incluir en el informe
4. Generar PDF con marca de agua de Synergyatech

## 🔧 Personalización

### Cambiar Precios
Editar en `script.js`:
```javascript
const PRICES = {
    panel: 1500000, // Modificar según proveedor
    // ... otros componentes
};
```

### Agregar Departamentos
En `index.html`, agregar opción en select:
```html
<option value="nuevo" data-radiation="4.5">Nuevo Depto - 4.5 kWh/m²/día</option>
```

### Modificar Logo/Marca
- Logo SVG en el header (index.html)
- Marca de agua en PDF (script.js, función generatePDF)
- Colores corporativos en styles.css (variables CSS)

## 📱 Responsive Design

La aplicación es totalmente responsive:
- **Desktop**: Layout completo con todas las funciones
- **Tablet**: Ajuste de grids y navegación
- **Móvil**: Navegación vertical, formularios adaptados

## 🐛 Solución de Problemas

### PDF no se genera
- Verificar conexión a internet (requiere librería jsPDF del CDN)
- Comprobar que se hayan calculado los sistemas primero
- Revisar consola del navegador para errores

### Gráficos no se muestran
- Requiere Chart.js del CDN
- Verificar conexión a internet
- Limpiar caché del navegador

### Dispositivos no se agregan
- Completar todos los campos requeridos
- Verificar valores numéricos válidos
- Máximo 24 horas de uso diario

## 📞 Soporte

**Synergyatech**
- Email: info@synergyatech.com
- Teléfono: +57 300 123 4567
- Web: www.synergyatech.com

## 📄 Licencia

© 2024 Synergyatech. Todos los derechos reservados.

## 🔄 Actualizaciones Futuras

- [ ] Integración con API de clima en tiempo real
- [ ] Base de datos de equipos con actualización automática
- [ ] Módulo de monitoreo post-instalación
- [ ] App móvil nativa
- [ ] Integración con CRM para seguimiento de clientes
- [ ] Calculadora de huella de carbono detallada
- [ ] Simulador 3D de instalación en techo