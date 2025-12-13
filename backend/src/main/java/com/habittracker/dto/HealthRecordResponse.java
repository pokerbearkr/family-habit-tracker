package com.habittracker.dto;

import com.habittracker.entity.HealthRecord;
import com.habittracker.entity.HealthRecord.RecordType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class HealthRecordResponse {
    private Long id;
    private Long userId;
    private String userDisplayName;
    private RecordType recordType;
    private LocalDate recordDate;
    private Integer systolic;
    private Integer diastolic;
    private Integer heartRate;
    private Double weight;
    private Integer bloodSugar;
    private String note;
    private String measureTime;
    private LocalDateTime createdAt;

    public static HealthRecordResponse from(HealthRecord record) {
        HealthRecordResponse response = new HealthRecordResponse();
        response.setId(record.getId());
        response.setUserId(record.getUser().getId());
        response.setUserDisplayName(record.getUser().getDisplayName());
        response.setRecordType(record.getRecordType());
        response.setRecordDate(record.getRecordDate());
        response.setSystolic(record.getSystolic());
        response.setDiastolic(record.getDiastolic());
        response.setHeartRate(record.getHeartRate());
        response.setWeight(record.getWeight());
        response.setBloodSugar(record.getBloodSugar());
        response.setNote(record.getNote());
        response.setMeasureTime(record.getMeasureTime());
        response.setCreatedAt(record.getCreatedAt());
        return response;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserDisplayName() {
        return userDisplayName;
    }

    public void setUserDisplayName(String userDisplayName) {
        this.userDisplayName = userDisplayName;
    }

    public RecordType getRecordType() {
        return recordType;
    }

    public void setRecordType(RecordType recordType) {
        this.recordType = recordType;
    }

    public LocalDate getRecordDate() {
        return recordDate;
    }

    public void setRecordDate(LocalDate recordDate) {
        this.recordDate = recordDate;
    }

    public Integer getSystolic() {
        return systolic;
    }

    public void setSystolic(Integer systolic) {
        this.systolic = systolic;
    }

    public Integer getDiastolic() {
        return diastolic;
    }

    public void setDiastolic(Integer diastolic) {
        this.diastolic = diastolic;
    }

    public Integer getHeartRate() {
        return heartRate;
    }

    public void setHeartRate(Integer heartRate) {
        this.heartRate = heartRate;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Integer getBloodSugar() {
        return bloodSugar;
    }

    public void setBloodSugar(Integer bloodSugar) {
        this.bloodSugar = bloodSugar;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getMeasureTime() {
        return measureTime;
    }

    public void setMeasureTime(String measureTime) {
        this.measureTime = measureTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
