package com.habittracker.repository;

import com.habittracker.entity.HealthRecord;
import com.habittracker.entity.HealthRecord.RecordType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HealthRecordRepository extends JpaRepository<HealthRecord, Long> {

    // 특정 사용자의 특정 타입 기록 조회 (날짜 범위)
    List<HealthRecord> findByUserIdAndRecordTypeAndRecordDateBetweenOrderByRecordDateDescCreatedAtDesc(
            Long userId, RecordType recordType, LocalDate startDate, LocalDate endDate);

    // 특정 사용자의 모든 기록 조회 (날짜 범위)
    List<HealthRecord> findByUserIdAndRecordDateBetweenOrderByRecordDateDescCreatedAtDesc(
            Long userId, LocalDate startDate, LocalDate endDate);

    // 가족 전체의 특정 타입 기록 조회 (날짜 범위)
    List<HealthRecord> findByFamilyIdAndRecordTypeAndRecordDateBetweenOrderByRecordDateDescCreatedAtDesc(
            Long familyId, RecordType recordType, LocalDate startDate, LocalDate endDate);

    // 가족 전체의 모든 기록 조회 (날짜 범위)
    List<HealthRecord> findByFamilyIdAndRecordDateBetweenOrderByRecordDateDescCreatedAtDesc(
            Long familyId, LocalDate startDate, LocalDate endDate);

    // 특정 사용자의 최근 N개 기록 조회
    List<HealthRecord> findTop30ByUserIdAndRecordTypeOrderByRecordDateDescCreatedAtDesc(
            Long userId, RecordType recordType);

    // 특정 날짜의 기록 조회
    List<HealthRecord> findByUserIdAndRecordDateOrderByCreatedAtDesc(Long userId, LocalDate recordDate);

    // 그래프용: 특정 사용자의 특정 타입 기록 (오래된 순)
    @Query("SELECT h FROM HealthRecord h WHERE h.user.id = :userId AND h.recordType = :recordType " +
           "AND h.recordDate BETWEEN :startDate AND :endDate ORDER BY h.recordDate ASC, h.createdAt ASC")
    List<HealthRecord> findForChart(@Param("userId") Long userId,
                                    @Param("recordType") RecordType recordType,
                                    @Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate);
}
