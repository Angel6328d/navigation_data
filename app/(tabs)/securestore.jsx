import { useState, useEffect } from "react"
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native"
import * as SecureStore from "expo-secure-store"
import { Feather } from '@expo/vector-icons'

export default function SecureStoreTab() {
  const [tempData, setTempData] = useState("")
  const [data, setData] = useState("")
  const [storedData, setStoredData] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const STORAGE_KEY = "secureUserData"

  // Guardar datos en SecureStore
  const saveData = async () => {
    // Validación para no guardar datos vacíos
    if (!data.trim()) {
      Alert.alert("Error", "Por favor ingresa un dato antes de guardar.")
      return
    }

    setIsLoading(true)
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, data)
      setTempData(data)
      Alert.alert("Guardado", "Dato guardado de forma segura.")
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el dato de forma segura.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos desde SecureStore
  const loadData = async () => {
    setIsLoading(true)
    try {
      const value = await SecureStore.getItemAsync(STORAGE_KEY)
      if (value !== null) {
        setStoredData(value)
      } else {
        Alert.alert("Información", "No hay datos almacenados.")
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar el dato seguro.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Eliminar datos de SecureStore
  const clearData = async () => {
    if (!storedData) {
      Alert.alert("Información", "No hay datos para eliminar.")
      return
    }

    setIsLoading(true)
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY)
      setStoredData("")
      Alert.alert("Eliminado", "Dato seguro eliminado.")
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar el dato seguro.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar el dato almacenado al iniciar la pestaña
  useEffect(() => {
    loadData()
  }, []) // Removed loadData as a dependency

  // Alternar visibilidad del texto sensible
  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SecureStore Example</Text>
      <Text style={styles.subtitle}>Almacenamiento seguro de datos sensibles</Text>

      <Text style={styles.label}>Ingresa un dato sensible:</Text>
      <View style={styles.inputContainer}>
        <TextInput
          value={data}
          onChangeText={setData}
          style={styles.input}
          placeholder="Ej: contraseña, token, etc."
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeIcon}>
          <Text>{showPassword ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Guardar Dato Seguro" onPress={saveData} disabled={isLoading} />
        <Button title="Cargar Dato Seguro" onPress={loadData} disabled={isLoading} />
        <Button title="Eliminar Dato Seguro" onPress={clearData} disabled={isLoading} />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Procesando...</Text>
        </View>
      )}

      {storedData ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Dato seguro guardado:</Text>
          <View style={styles.secureDataContainer}>
            <Text style={styles.resultValue}>
              {showPassword ? storedData : storedData.replace(/./g, '•')}
            </Text>
            <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeIconSmall}>
              <Text>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={styles.resultContainer}>
        <Text style={styles.resultLabel}>Dato Temporal:</Text>
        <Text style={styles.resultValue}>{tempData}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginVertical: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  eyeIconSmall: {
    padding: 5,
  },
  buttonContainer: {
    marginVertical: 15,
    gap: 10,
  },
  resultContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
  },
  resultLabel: {
    fontSize: 14,
    color: "#666",
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 5,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  loadingText: {
    marginTop: 5,
    color: '#666',
  },
  secureDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  }
})