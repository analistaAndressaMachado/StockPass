import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "./src/services/api";
import { Dashboard, Product } from "./src/types";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [productResponse, dashboardResponse] = await Promise.all([
        api.get("/products"),
        api.get("/dashboard"),
      ]);
      setProducts(productResponse.data.data ?? []);
      setDashboard(dashboardResponse.data.data);
    } catch {
      Alert.alert(
        "Erro de conexão",
        "Verifique se o Laravel está rodando e se o IP em src/services/api.ts está correto."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = products.filter((product) =>
    `${product.name} ${product.code}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>StockPass</Text>
      <Text style={styles.subtitle}>Controle de estoque</Text>

      {dashboard && (
        <View style={styles.dashboard}>
          <Card label="Produtos" value={dashboard.total_produtos} />
          <Card label="Itens" value={dashboard.total_itens} />
          <Card label="Estoque baixo" value={dashboard.produtos_estoque_baixo} />
          <Card label="Alertas" value={dashboard.alertas_ativos} />
        </View>
      )}

      <TextInput
        style={styles.search}
        placeholder="Pesquisar produto..."
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          refreshing={loading}
          onRefresh={loadData}
          ListEmptyComponent={<Text>Nenhum produto encontrado.</Text>}
          renderItem={({ item }) => (
            <View style={styles.product}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text>Código: {item.code}</Text>
                <Text>Quantidade: {item.quantity}</Text>
                <Text>Mínimo: {item.minimum_stock}</Text>
              </View>
              <View style={styles.badge}>
                <Text>{item.quantity <= item.minimum_stock ? "BAIXO" : "OK"}</Text>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={loadData}>
        <Text style={styles.buttonText}>Atualizar estoque</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f6f8" },
  title: { fontSize: 32, fontWeight: "700" },
  subtitle: { fontSize: 16, marginBottom: 18 },
  dashboard: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 15 },
  card: { width: "47%", backgroundColor: "white", padding: 15, borderRadius: 12 },
  cardValue: { fontSize: 24, fontWeight: "700" },
  cardLabel: { marginTop: 4 },
  search: { backgroundColor: "white", borderRadius: 10, padding: 14, marginBottom: 12 },
  product: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
  },
  productName: { fontSize: 18, fontWeight: "700", marginBottom: 5 },
  badge: {
    alignSelf: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#e8eef5",
  },
  button: {
    backgroundColor: "#222",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
