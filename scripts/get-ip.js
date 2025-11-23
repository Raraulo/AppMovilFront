const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Obtiene la dirección IP local de la máquina host.
 * Prioriza interfaces comunes de red inalámbrica y cableada.
 * @returns {string} La dirección IPv4 local.
 */
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    
    // Priorizar WiFi sobre Ethernet para desarrollo móvil
    // Nombres comunes para Windows, Linux y macOS
    const preferredNames = ['Wi-Fi', 'WiFi', 'WLAN', 'Ethernet', 'eth0', 'en0'];
    
    // 1. Búsqueda por nombres preferidos
    for (const prefName of preferredNames) {
        // La comparación debe ser case-insensitive si es posible, o revisar todas las keys
        const interfaceKeys = Object.keys(interfaces);
        for (const key of interfaceKeys) {
            if (key.toLowerCase().includes(prefName.toLowerCase())) {
                for (const iface of interfaces[key]) {
                    // Buscar IPv4 que no sea la dirección de loopback (127.0.0.1)
                    if (iface.family === 'IPv4' && !iface.internal) {
                        return iface.address;
                    }
                }
            }
        }
    }
    
    // 2. Fallback: Buscar en todas las interfaces si no se encuentra por nombre
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    
    // 3. Fallback final si no se encuentra ninguna IP pública/local
    return '192.168.1.5';
}

/**
 * Genera el archivo config.ts con la IP detectada.
 * Este archivo se guarda en el directorio raíz del proyecto (..)
 */
function generateConfig() {
    const ip = getLocalIP();
    // Define la ruta al archivo de configuración a generar (e.g., ../config.ts)
    const configPath = path.join(__dirname, '..', 'config.ts');
    
    const config = `// ⚠️ Auto-generado - No editar manualmente
// Este archivo se regenera cada vez que ejecutas npm start (o un script similar)

/**
 * @type {string} La URL base del API de Django en desarrollo.
 * Detectada automáticamente por ${path.basename(__filename)}
 */
export const API_URL = "http://${ip}:8000";

console.log("📡 Conectando a servidor Django en:", API_URL);
`;

    try {
        fs.writeFileSync(configPath, config, 'utf8');
        console.log('--- Configuración de IP Automática ---');
        console.log('✅ IP detectada automáticamente:', ip);
        console.log('📁 Archivo config.ts actualizado');
        console.log('🌐 URL del servidor:', `http://${ip}:8000`);
        console.log('------------------------------------');
    } catch (error) {
        console.error('❌ Error generando config.ts:', error);
        process.exit(1);
    }
}

// Ejecutar la función principal para generar la configuración
generateConfig();