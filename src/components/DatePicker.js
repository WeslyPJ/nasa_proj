import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const DatePicker = ({ selectedDate, onDateChange, style }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Generate next 7 days for forecast
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  const dates = generateDates();
  
  const formatDate = (date) => {
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };
  
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };
  
  const handleDateSelect = (date) => {
    const dateString = formatDateForAPI(date);
    onDateChange(dateString);
    setModalVisible(false);
  };
  
  const getSelectedDateText = () => {
    if (!selectedDate) return 'Today';
    
    try {
      const selected = new Date(selectedDate);
      const today = new Date();
      
      // Check if the date is valid
      if (isNaN(selected.getTime())) {
        return 'Today';
      }
      
      if (selected.toDateString() === today.toDateString()) {
        return 'Today';
      }
      
      return formatDate(selected);
    } catch (error) {
      console.error('Error formatting selected date:', error);
      return 'Today';
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.dateButtonText}>
          📅 {getSelectedDateText()}
        </Text>
      </TouchableOpacity>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.datesList}>
              {dates.map((date, index) => {
                const dateString = formatDateForAPI(date);
                const isSelected = selectedDate === dateString;
                const isToday = index === 0;
                
                return (
                  <TouchableOpacity
                    key={dateString}
                    style={[
                      styles.dateOption,
                      isSelected && styles.selectedDateOption
                    ]}
                    onPress={() => handleDateSelect(date)}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      isSelected && styles.selectedDateOptionText
                    ]}>
                      {isToday ? 'Today' : formatDate(date)}
                    </Text>
                    {isToday && (
                      <Text style={styles.todayLabel}>Current</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  dateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  datesList: {
    gap: 8,
  },
  dateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedDateOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedDateOptionText: {
    color: 'white',
  },
  todayLabel: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default DatePicker;