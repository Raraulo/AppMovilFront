// app/(tabs)/facturas.tsx
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getApiUrl } from "../../config";

const { width, height } = Dimensions.get("window");

interface Producto {
  id: number;
  nombre: string;
  marca: string;
  tipo: string;
  imagen: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// ✅ INTERFAZ ACTUALIZADA CON TODOS LOS DATOS DEL CLIENTE
interface Factura {
  id: number;
  numero_orden: string;
  fecha: string;
  total: number;
  metodo_pago: string;
  productos: Producto[];
  cliente: {
    nombre: string;
    apellido: string;
    email: string;
    cedula?: string;      // ✅ NUEVO
    direccion?: string;   // ✅ NUEVO
    celular?: string;     // ✅ NUEVO
  };
}

// ✨ ITEM DE LISTA SIMPLE Y ELEGANTE
const FacturaListItem = ({ factura, onPress, index }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  const formatFechaCorta = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatMetodoPago = (metodo: string) => {
    const metodos: { [key: string]: string } = {
      wawallet: "WaWallet",
      efectivo: "Efectivo",
      tarjeta: "Tarjeta",
    };
    return metodos[metodo] || metodo;
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={styles.listItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.listItemLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="receipt-outline" size={22} color="#000" />
          </View>
          <View style={styles.listItemInfo}>
            <Text style={styles.listItemOrder}>{factura.numero_orden}</Text>
            <Text style={styles.listItemDate}>{formatFechaCorta(factura.fecha)}</Text>
            <View style={styles.listItemMetaRow}>
              <View style={styles.listItemMeta}>
                <Ionicons name="cube-outline" size={12} color="#999" />
                <Text style={styles.listItemMetaText}>
                  {factura.productos.length} {factura.productos.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <View style={styles.listItemMeta}>
                <Ionicons name="card-outline" size={12} color="#999" />
                <Text style={styles.listItemMetaText}>
                  {formatMetodoPago(factura.metodo_pago)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.listItemRight}>
          <Text style={styles.listItemTotal}>${factura.total.toFixed(2)}</Text>
          <View style={styles.chevronButton}>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function FacturasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  const [isLogged, setIsLogged] = useState(false);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Factura | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, []);

  useEffect(() => {
    checkLoginAndLoadFacturas();
  }, []);

  const checkLoginAndLoadFacturas = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        setIsLogged(true);
        const user = JSON.parse(userStr);
        await loadFacturas(user.id);
      } else {
        setIsLogged(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error verificando sesión:", error);
      setIsLogged(false);
      setLoading(false);
    }
  };

  const loadFacturas = async (usuarioId: number) => {
    try {
      setLoading(true);
      console.log(`📥 Cargando facturas del usuario ${usuarioId}...`);
      
      const API_URL = await getApiUrl();
      console.log(`🌐 Usando API URL: ${API_URL}`);

      const response = await fetch(
        `${API_URL}/api/usuarios/${usuarioId}/facturas/`
      );
      const data = await response.json();

      console.log("📦 Facturas recibidas:", data);

      if (response.ok) {
        setFacturas(data.facturas || []);
      } else {
        console.error("❌ Error al cargar facturas:", data);
        setFacturas([]);
      }
    } catch (error) {
      console.error("Error de red:", error);
      setFacturas([]);
      Alert.alert(
        "Error de Conexión",
        "No se pudo conectar al servidor. Asegúrate de que tu servidor Django esté corriendo y que la dirección IP sea correcta."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(50);
    }
    const userStr = await AsyncStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      await loadFacturas(user.id);
    } else {
      setRefreshing(false);
    }
  };

  const formatFecha = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatMetodoPago = (metodo: string) => {
    const metodos: { [key: string]: string } = {
      wawallet: "WaWallet",
      efectivo: "Efectivo",
      tarjeta: "Tarjeta de Crédito",
    };
    return metodos[metodo] || metodo;
  };

  const generarPDF = async (factura: Factura) => {
    try {
      setGeneratingPDF(true);

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate(50);
      }

      const IVA_PORCENTAJE = 0.15;
      const total = factura.total;
      const subtotal = total / (1 + IVA_PORCENTAJE);
      const iva = total - subtotal;

      const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${factura.numero_orden}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Georgia', serif;
      padding: 50px;
      background: #fff;
      color: #1a1a1a;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #000;
      padding-bottom: 25px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 8px;
      letter-spacing: 3px;
      color: #000;
    }
    .subtitle {
      font-size: 14px;
      color: #666;
      font-style: italic;
      letter-spacing: 1px;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 35px;
      padding: 20px;
      background: #fafafa;
      border-radius: 8px;
    }
    .info-box {
      flex: 1;
    }
    .info-title {
      font-weight: bold;
      font-size: 11px;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .info-value {
      font-size: 15px;
      color: #000;
      line-height: 1.6;
    }
    .info-value-small {
      font-size: 13px;
      color: #666;
      line-height: 1.6;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin: 30px 0 20px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 35px;
    }
    th {
      background: #000;
      color: #fff;
      padding: 15px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    td {
      padding: 15px;
      border-bottom: 1px solid #e8e8e8;
      font-size: 14px;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .product-name {
      font-weight: bold;
      color: #000;
      margin-bottom: 4px;
    }
    .product-details {
      font-size: 12px;
      color: #666;
    }
    .totals-section {
      margin-top: 30px;
      padding: 25px;
      background: #fafafa;
      border-radius: 8px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 15px;
    }
    .total-label {
      font-weight: 600;
      color: #333;
    }
    .total-value {
      font-weight: 600;
      color: #000;
    }
    .final-total {
      border-top: 3px solid #000;
      padding-top: 18px;
      margin-top: 15px;
      font-size: 20px;
      font-weight: bold;
    }
    .final-total .total-value {
      font-size: 24px;
      color: #000;
    }
    .footer {
      margin-top: 60px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 25px;
      line-height: 1.8;
    }
    .footer-bold {
      font-weight: bold;
      color: #000;
      margin-top: 8px;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">MAISON DES SENTEURS</div>
    <div class="subtitle">Perfumería de Lujo</div>
  </div>

  <div class="info-section">
    <div class="info-box">
      <div class="info-title">Factura No.</div>
      <div class="info-value">${factura.numero_orden}</div>
    </div>
    <div class="info-box" style="text-align: right;">
      <div class="info-title">Fecha de Emisión</div>
      <div class="info-value">${formatFecha(factura.fecha)}</div>
    </div>
  </div>

  <div class="info-section">
    <div class="info-box">
      <div class="info-title">Facturado a</div>
      <div class="info-value">
        ${factura.cliente.nombre} ${factura.cliente.apellido}
      </div>
      ${factura.cliente.cedula ? `<div class="info-value-small">CI: ${factura.cliente.cedula}</div>` : ''}
      <div class="info-value-small">${factura.cliente.email}</div>
      ${factura.cliente.celular ? `<div class="info-value-small">Tel: ${factura.cliente.celular}</div>` : ''}
      ${factura.cliente.direccion ? `<div class="info-value-small" style="margin-top: 8px;">${factura.cliente.direccion}</div>` : ''}
    </div>
    <div class="info-box" style="text-align: right;">
      <div class="info-title">Método de Pago</div>
      <div class="info-value">${formatMetodoPago(factura.metodo_pago)}</div>
    </div>
  </div>

  <div class="section-title">Detalle de Productos</div>

  <table>
    <thead>
      <tr>
        <th style="width: 45%;">Producto</th>
        <th style="width: 15%; text-align: center;">Cantidad</th>
        <th style="width: 20%; text-align: right;">Precio Unit.</th>
        <th style="width: 20%; text-align: right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${factura.productos
        .map(
          (producto) => `
      <tr>
        <td>
          <div class="product-name">${producto.nombre}</div>
          <div class="product-details">${producto.marca} - ${producto.tipo}</div>
        </td>
        <td style="text-align: center;">${producto.cantidad}</td>
        <td style="text-align: right;">$${producto.precio_unitario.toFixed(2)}</td>
        <td style="text-align: right; font-weight: 600;">$${producto.subtotal.toFixed(2)}</td>
      </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="total-row">
      <div class="total-label">Subtotal:</div>
      <div class="total-value">$${subtotal.toFixed(2)}</div>
    </div>
    <div class="total-row">
      <div class="total-label">IVA (15%):</div>
      <div class="total-value">$${iva.toFixed(2)}</div>
    </div>
    <div class="total-row final-total">
      <div class="total-label">TOTAL:</div>
      <div class="total-value">$${total.toFixed(2)}</div>
    </div>
  </div>

  <div class="footer">
    <p>Gracias por su compra en Maison Des Senteurs</p>
    <p class="footer-bold">Perfumería de Lujo</p>
    <p style="margin-top: 12px;">Esta es una factura electrónica válida</p>
  </div>
</body>
</html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      console.log("✅ PDF generado:", uri);

      const fileName = `Factura_${factura.numero_orden}.pdf`;

      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: `Compartir Factura ${factura.numero_orden}`,
      });
    } catch (error) {
      console.error("❌ Error generando PDF:", error);
      Alert.alert("Error", "No se pudo generar el PDF. Revisa los permisos de almacenamiento.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // 🔒 NO LOGUEADO
  if (!isLogged) {
    return (
      <Animated.View style={[styles.notLoggedContainer, { opacity: fadeAnim }]}>
        <View style={styles.notLoggedIconContainer}>
          <Ionicons name="receipt-outline" size={80} color="#ddd" />
        </View>
        <Text style={styles.notLoggedTitle}>Mis facturas</Text>
        <Text style={styles.notLoggedText}>
          Inicia sesión para ver tu historial de compras y facturas
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/(auth)/login")}
          activeOpacity={0.85}
        >
          <Ionicons name="log-in-outline" size={20} color="#fff" />
          <Text style={styles.loginText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // 🔄 CARGANDO
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Cargando facturas...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ✨ HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => (selected ? setSelected(null) : router.push("/(tabs)/profile"))}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonContainer}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selected ? "Detalle" : "Facturas"}
        </Text>
        {!selected && (
          <TouchableOpacity 
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="#000" />
          </TouchableOpacity>
        )}
        {selected && <View style={{ width: 44 }} />}
      </View>

      {selected ? (
        // 📄 DETALLE DE FACTURA
        <ScrollView
          contentContainerStyle={[
            styles.detailContainer,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.detailCard}>
            {/* Logo */}
            <Image
              source={require("../../assets/images/logomaison.png")}
              style={styles.logoEmpresa}
              resizeMode="contain"
            />

            {/* Header Info */}
            <View style={styles.detailHeaderSection}>
              <View style={styles.detailInfoBox}>
                <Text style={styles.detailInfoLabel}>Factura</Text>
                <Text style={styles.detailInfoValue}>{selected.numero_orden}</Text>
              </View>
              <View style={[styles.detailInfoBox, { alignItems: 'flex-end' }]}>
                <Text style={styles.detailInfoLabel}>Fecha</Text>
                <Text style={styles.detailInfoValue}>{formatFecha(selected.fecha)}</Text>
              </View>
            </View>

            <View style={styles.dividerLine} />

            {/* ✅ CLIENTE CON TODOS LOS DATOS */}
            <View style={styles.clienteSection}>
              <Text style={styles.sectionLabel}>Facturado a</Text>
              <Text style={styles.clienteNombre}>
                {selected.cliente.nombre} {selected.cliente.apellido}
              </Text>
              {selected.cliente.cedula && (
                <View style={styles.clienteInfoRow}>
                  <Ionicons name="card-outline" size={14} color="#999" />
                  <Text style={styles.clienteInfoText}>CI: {selected.cliente.cedula}</Text>
                </View>
              )}
              <View style={styles.clienteInfoRow}>
                <Ionicons name="mail-outline" size={14} color="#999" />
                <Text style={styles.clienteInfoText}>{selected.cliente.email}</Text>
              </View>
              {selected.cliente.celular && (
                <View style={styles.clienteInfoRow}>
                  <Ionicons name="call-outline" size={14} color="#999" />
                  <Text style={styles.clienteInfoText}>{selected.cliente.celular}</Text>
                </View>
              )}
              {selected.cliente.direccion && (
                <View style={styles.clienteInfoRow}>
                  <Ionicons name="location-outline" size={14} color="#999" />
                  <Text style={styles.clienteInfoText}>{selected.cliente.direccion}</Text>
                </View>
              )}
            </View>

            <View style={styles.dividerLine} />

            {/* Productos */}
            <Text style={styles.sectionTitle}>
              Productos ({selected.productos.length})
            </Text>

            {selected.productos.map((producto, index) => (
              <View key={index} style={styles.productoItem}>
                <View style={styles.productoImageContainer}>
                  <Image
                    source={{
                      uri:
                        producto.imagen ||
                        "https://via.placeholder.com/70/CCCCCC/000000?text=Producto",
                    }}
                    style={styles.productoImagen}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.productoInfo}>
                  <Text style={styles.productoNombre} numberOfLines={2}>
                    {producto.nombre}
                  </Text>
                  <Text style={styles.productoMarca}>{producto.marca}</Text>
                  <Text style={styles.productoTipo}>{producto.tipo}</Text>
                  <View style={styles.productoCantidadRow}>
                    <Text style={styles.productoCantidad}>
                      {producto.cantidad} x ${producto.precio_unitario.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.productoSubtotal}>
                  ${producto.subtotal.toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={styles.dividerLine} />

            {/* Resumen */}
            <Text style={styles.sectionTitle}>Resumen de pago</Text>

            {(() => {
              const IVA_PORCENTAJE = 0.15;
              const total = selected.total;
              const subtotal = total / (1 + IVA_PORCENTAJE);
              const iva = total - subtotal;

              return (
                <View style={styles.resumenContainer}>
                  <View style={styles.resumenRow}>
                    <Text style={styles.resumenLabel}>Subtotal</Text>
                    <Text style={styles.resumenValue}>${subtotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.resumenRow}>
                    <Text style={styles.resumenLabel}>IVA (15%)</Text>
                    <Text style={styles.resumenValue}>${iva.toFixed(2)}</Text>
                  </View>
                  <View style={styles.dividerDashed} />
                  <View style={styles.resumenRowTotal}>
                    <Text style={styles.resumenLabelTotal}>Total</Text>
                    <Text style={styles.resumenValueTotal}>${total.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })()}

            <View style={styles.pagoMethodContainer}>
              <Ionicons name="card-outline" size={20} color="#666" />
              <Text style={styles.pagoMethodText}>
                Pagado con {formatMetodoPago(selected.metodo_pago)}
              </Text>
            </View>
          </View>

          {/* Botón PDF */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => generarPDF(selected)}
            disabled={generatingPDF}
            activeOpacity={0.85}
          >
            {generatingPDF ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={22} color="#fff" />
                <Text style={styles.shareText}>Descargar PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        // 🧾 LISTA DE FACTURAS (SIMPLE Y LIMPIA)
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#000"
            />
          }
        >
          {facturas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={80} color="#ddd" />
              </View>
              <Text style={styles.emptyText}>Sin facturas</Text>
              <Text style={styles.emptySubtext}>
                Tus compras aparecerán aquí
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Historial de compras</Text>
                <Text style={styles.listCount}>
                  {facturas.length} {facturas.length === 1 ? 'factura' : 'facturas'}
                </Text>
              </View>
              {facturas.map((factura, index) => (
                <FacturaListItem
                  key={factura.id}
                  factura={factura}
                  index={index}
                  onPress={() => setSelected(factura)}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ✨ ESTILOS PREMIUM COMPLETOS
const styles = StyleSheet.create({
  // ✨ NO LOGUEADO
  notLoggedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 40,
  },
  notLoggedIconContainer: {
    marginBottom: 30,
  },
  notLoggedTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    color: "#111",
    marginBottom: 15,
    letterSpacing: 1,
  },
  notLoggedText: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#000",
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loginText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#fff",
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ✨ LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 15,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    color: "#666",
  },

  // ✨ HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 44,
  },
  backButtonContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    color: "#111",
    letterSpacing: 2,
  },

  // ✨ LISTA SIMPLE
  container: {
    padding: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  listTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 16,
    color: "#111",
    letterSpacing: 0.5,
  },
  listCount: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 13,
    color: "#999",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  emptyIconContainer: {
    marginBottom: 25,
  },
  emptyText: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 24,
    color: "#111",
    marginBottom: 10,
  },
  emptySubtext: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 15,
    color: "#999",
  },

  // ✨ ITEM DE LISTA
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemOrder: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    color: "#000",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  listItemDate: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  listItemMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listItemMetaText: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    color: "#999",
  },
  listItemRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  listItemTotal: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    color: "#000",
    marginBottom: 8,
  },
  chevronButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ✨ DETALLE
  detailContainer: {
    padding: 20,
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  logoEmpresa: {
    width: 160,
    height: 60,
    alignSelf: "center",
    marginBottom: 25,
  },
  detailHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailInfoBox: {
    flex: 1,
  },
  detailInfoLabel: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    color: "#999",
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailInfoValue: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    color: "#000",
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 20,
  },
  clienteSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clienteNombre: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 16,
    color: "#000",
    marginBottom: 8,
  },
  clienteEmail: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 13,
    color: "#666",
  },
  // ✅ NUEVOS ESTILOS PARA INFO DEL CLIENTE
  clienteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  clienteInfoText: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 16,
    color: "#000",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  productoItem: {
    flexDirection: "row",
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  productoImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  productoImagen: {
    width: '100%',
    height: '100%',
  },
  productoInfo: {
    flex: 1,
    marginLeft: 14,
  },
  productoNombre: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 15,
    color: "#000",
    marginBottom: 4,
    lineHeight: 20,
  },
  productoMarca: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  productoTipo: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  productoCantidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productoCantidad: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 13,
    color: "#666",
  },
  productoSubtotal: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 16,
    color: "#000",
    marginLeft: 12,
  },
  resumenContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  resumenLabel: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 14,
    color: "#666",
  },
  resumenValue: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 14,
    color: "#000",
  },
  dividerDashed: {
    height: 1,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  resumenRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  resumenLabelTotal: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    color: "#000",
  },
  resumenValueTotal: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    color: "#000",
  },
  pagoMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 10,
  },
  pagoMethodText: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 14,
    color: "#666",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  shareText: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#fff",
    fontSize: 15,
    letterSpacing: 1,
  },
});
