import { useState, useEffect } from "react"
import { View, Text, TextInput, Button, Alert, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator } from "react-native"
import * as SQLite from "expo-sqlite"

export default function SQLiteTab() {
  const [db, setDb] = useState(null)
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [people, setPeople] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isEditing, setIsEditing] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const itemsPerPage = 5

  // Inicializar la base de datos
  useEffect(() => {
    const database = SQLite.openDatabase("peopledb.db")
    setDb(database)

    // Crear la tabla si no existe
    database.transaction(
      (tx) => {
        tx.executeSql(
          "CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, age INTEGER);",
        )
      },
      (error) => {
        console.log("Error al crear la tabla:", error)
      },
      () => {
        console.log("Tabla creada o ya existente")
        // Cargar datos iniciales
        fetchPeople()
        countTotalPeople()
      },
    )
  }, [])

  // Contar el total de personas para la paginación
  const countTotalPeople = () => {
    if (db) {
      db.transaction((tx) => {
        tx.executeSql(
          "SELECT COUNT(*) as count FROM people;",
          [],
          (_, { rows }) => {
            const count = rows._array[0].count
            setTotalPages(Math.ceil(count / itemsPerPage))
          },
          (_, error) => {
            console.log("Error al contar registros:", error)
            return false
          },
        )
      })
    }
  }

  // Consultar personas de la base de datos con paginación
  const fetchPeople = () => {
    if (db) {
      setIsLoading(true)
      const offset = (currentPage - 1) * itemsPerPage
      
      db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM people ORDER BY id DESC LIMIT ? OFFSET ?;",
          [itemsPerPage, offset],
          (_, { rows }) => {
            setPeople(rows._array)
            setIsLoading(false)
          },
          (_, error) => {
            console.log("Error al consultar datos:", error)
            setIsLoading(false)
            return false
          },
        )
      })
    }
  }

  // Efecto para actualizar la lista cuando cambia la página
  useEffect(() => {
    fetchPeople()
  }, [currentPage])

  // Agregar una persona a la base de datos
  const addPerson = () => {
    if (name === "" || age === "") {
      Alert.alert("Error", "Por favor ingresa nombre y edad")
      return
    }

    const ageNum = Number.parseInt(age)
    if (isNaN(ageNum)) {
      Alert.alert("Error", "La edad debe ser un número")
      return
    }

    setIsLoading(true)
    db.transaction((tx) => {
      tx.executeSql(
        "INSERT INTO people (name, age) VALUES (?, ?);",
        [name, ageNum],
        (_, result) => {
          if (result.rowsAffected > 0) {
            Alert.alert("Éxito", "Persona agregada correctamente")
            setName("")
            setAge("")
            fetchPeople() // Actualizar la lista
            countTotalPeople() // Actualizar total de páginas
            setCurrentPage(1) // Volver a la primera página
          } else {
            Alert.alert("Error", "No se pudo agregar la persona")
          }
          setIsLoading(false)
        },
        (_, error) => {
          console.log("Error al insertar:", error)
          setIsLoading(false)
          return false
        },
      )
    })
  }

  // Eliminar todos los registros
  const clearTable = () => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar todos los registros?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => {
            setIsLoading(true)
            db.transaction((tx) => {
              tx.executeSql(
                "DELETE FROM people;",
                [],
                (_, result) => {
                  Alert.alert("Éxito", "Todos los registros han sido eliminados")
                  fetchPeople() // Actualizar la lista
                  countTotalPeople() // Actualizar total de páginas
                  setCurrentPage(1) // Volver a la primera página
                  setIsLoading(false)
                },
                (_, error) => {
                  console.log("Error al eliminar registros:", error)
                  setIsLoading(false)
                  return false
                },
              )
            })
          }
        }
      ]
    )
  }

  // Eliminar una persona específica
  const deletePerson = (id) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este registro?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => {
            setIsLoading(true)
            db.transaction((tx) => {
              tx.executeSql(
                "DELETE FROM people WHERE id = ?;",
                [id],
                (_, result) => {
                  if (result.rowsAffected > 0) {
                    Alert.alert("Éxito", "Registro eliminado correctamente")
                    fetchPeople() // Actualizar la lista
                    countTotalPeople() // Actualizar total de páginas
                  } else {
                    Alert.alert("Error", "No se pudo eliminar el registro")
                  }
                  setIsLoading(false)
                },
                (_, error) => {
                  console.log("Error al eliminar registro:", error)
                  setIsLoading(false)
                  return false
                },
              )
            })
          }
        }
      ]
    )
  }

  // Abrir modal para editar
  const openEditModal = (person) => {
    setEditingPerson(person)
    setName(person.name)
    setAge(person.age.toString())
    setIsEditing(true)
    setModalVisible(true)
  }

  // Actualizar persona
  const updatePerson = () => {
    if (name === "" || age === "") {
      Alert.alert("Error", "Por favor ingresa nombre y edad")
      return
    }

    const ageNum = Number.parseInt(age)
    if (isNaN(ageNum)) {
      Alert.alert("Error", "La edad debe ser un número")
      return
    }

    setIsLoading(true)
    db.transaction((tx) => {
      tx.executeSql(
        "UPDATE people SET name = ?, age = ? WHERE id = ?;",
        [name, ageNum, editingPerson.id],
        (_, result) => {
          if (result.rowsAffected > 0) {
            Alert.alert("Éxito", "Registro actualizado correctamente")
            setModalVisible(false)
            setName("")
            setAge("")
            setIsEditing(false)
            fetchPeople() // Actualizar la lista
          } else {
            Alert.alert("Error", "No se pudo actualizar el registro")
          }
          setIsLoading(false)
        },
        (_, error) => {
          console.log("Error al actualizar:", error)
          setIsLoading(false)
          return false
        },
      )
    })
  }

  // Cancelar edición
  const cancelEdit = () => {
    setModalVisible(false)
    setName("")
    setAge("")
    setIsEditing(false)
  }

  // Cambiar de página
  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Renderizar un elemento de la lista
  const renderItem = ({ item }) => (
    <View style={styles.personItem}>
      <View>
        <Text style={styles.personName}>{item.name}</Text>
        <Text style={styles.personAge}>{item.age} años</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => deletePerson(item.id)}
        >
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQLite Example</Text>
      <Text style={styles.subtitle}>Base de datos local con SQLite</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre:</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ingresa un nombre" />

        <Text style={styles.label}>Edad:</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="Ingresa la edad"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Agregar Persona" onPress={addPerson} disabled={isLoading || isEditing} />
        <Button title="Actualizar Lista" onPress={fetchPeople} disabled={isLoading} />
        <Button title="Limpiar Tabla" onPress={clearTable} color="#ff6347" disabled={isLoading} />
      </View>

      <Text style={styles.listTitle}>Lista de Personas ({people.length})</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : people.length > 0 ? (
        <>
          <FlatList
            data={people}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
          />
          <View style={styles.pagination}>
            <Button 
              title="Anterior" 
              onPress={() => changePage(currentPage - 1)} 
              disabled={currentPage === 1 || isLoading}
            />
            <Text style={styles.pageInfo}>Página {currentPage} de {totalPages}</Text>
            <Button 
              title="Siguiente" 
              onPress={() => changePage(currentPage + 1)} 
              disabled={currentPage === totalPages || isLoading}
            />
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>No hay personas registradas</Text>
      )}

      {/* Modal para editar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={cancelEdit}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Editar Persona</Text>
            
            <Text style={styles.label}>Nombre:</Text>
            <TextInput 
              style={styles.modalInput} 
              value={name} 
              onChangeText={setName} 
              placeholder="Ingresa un nombre" 
            />

            <Text style={styles.label}>Edad:</Text>
            <TextInput
              style={styles.modalInput}
              value={age}
              onChangeText={setAge}
              placeholder="Ingresa la edad"
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelEdit}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={updatePerson}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 10,
    padding: 10,
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 20,
    gap: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  personItem: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  personName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  personAge: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 5,
  },
  actionButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  editButton: {
    backgroundColor: "#3498db",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 10,
  },
  pageInfo: {
    fontSize: 14,
    color: "#666",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 15,
    padding: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#95a5a6",
  },
  saveButton: {
    backgroundColor: "#2ecc71",
  },
})