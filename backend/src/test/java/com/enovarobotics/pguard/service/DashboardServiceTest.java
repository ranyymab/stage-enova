package com.enovarobotics.pguard.service;

import com.enovarobotics.pguard.model.entity.DetectionEvent;
import com.enovarobotics.pguard.model.entity.MissionEvent;
import com.enovarobotics.pguard.repository.DetectionEventRepository;
import com.enovarobotics.pguard.repository.KilometrageSummaryRepository;
import com.enovarobotics.pguard.repository.MissionEventRepository;
import com.enovarobotics.pguard.repository.ObstacleProgressRepository;
import com.enovarobotics.pguard.repository.TeleoperationEventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private MissionEventRepository missionEventRepository;

    @Mock
    private ObstacleProgressRepository obstacleProgressRepository;

    @Mock
    private TeleoperationEventRepository teleoperationEventRepository;

    @Mock
    private KilometrageSummaryRepository kilometrageSummaryRepository;

    @Mock
    private DetectionEventRepository detectionEventRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void buildAnomaliesRecentesShouldFilterToReferenceDate() {

        ReflectionTestUtils.setField(dashboardService, "robotId", "ROBOT-001");

        LocalDate today = LocalDate.of(2026, 7, 1);

        DetectionEvent todayDetection = DetectionEvent.builder()
                .id(1L)
                .robotId("ROBOT-001")
                .eventDate(today)
                .rawHour("01:00:00")
                .objectDetected("person")
                .criticite(DetectionEvent.Criticite.HAUTE)
                .statut(DetectionEvent.StatutAnomalie.NOUVELLE)
                .build();

        when(detectionEventRepository
                .findByEventDateOrderByEventDatetimeDesc(today))
                .thenReturn(List.of(todayDetection));

        List<Map<String, Object>> anomalies =
                dashboardService.buildAnomaliesRecentes(today);

        assertEquals(1, anomalies.size());
        assertEquals(1L, anomalies.get(0).get("id"));
        assertEquals("PERSON", anomalies.get(0).get("type"));
    }

    @Test
    void buildKpiShouldReportEmergencyTeleportationModeForUrgentSituation() {

        ReflectionTestUtils.setField(dashboardService, "robotId", "ROBOT-001");

        LocalDate today = LocalDate.of(2026, 7, 1);

        when(kilometrageSummaryRepository
                .findByRobotIdAndSummaryDate("ROBOT-001", today))
                .thenReturn(Optional.empty());

        when(kilometrageSummaryRepository
                .findFirstByRobotIdOrderBySummaryDateDesc("ROBOT-001"))
                .thenReturn(Optional.empty());

        when(detectionEventRepository
                .countByEventDateAndStatutNot(
                        today,
                        DetectionEvent.StatutAnomalie.RESOLUE))
                .thenReturn(4L);

        when(missionEventRepository
                .findByEventDateOrderByEventDatetimeAsc(today))
                .thenReturn(List.of(

                        MissionEvent.builder()
                                .category(MissionEvent.EventCategory.INSPECTING)
                                .info("start")
                                .eventDate(today)
                                .build(),

                        MissionEvent.builder()
                                .category(MissionEvent.EventCategory.INSPECTING)
                                .info("start")
                                .eventDate(today)
                                .build()
                ));

        when(teleoperationEventRepository
                .findByEventDateOrderByEventDatetimeAsc(today))
                .thenReturn(List.of());

        when(obstacleProgressRepository
                .findByEventDateOrderByEventDatetimeAsc(today))
                .thenReturn(List.of());

        when(missionEventRepository
                .findByCategoryAndEventDateOrderByEventDatetimeAsc(
                        MissionEvent.EventCategory.DOCKING,
                        today))
                .thenReturn(List.of());

        when(missionEventRepository.findAll())
                .thenReturn(List.of());

        Map<String, Object> kpi =
                dashboardService.buildKpi(today);

        assertEquals(4L, kpi.get("anomalies"));
    }

    @Test
    void buildKpiShouldReportRetourBaseWhenBackHomeSessionIsOpen() {

        ReflectionTestUtils.setField(dashboardService, "robotId", "ROBOT-001");

        LocalDate today = LocalDate.of(2026, 7, 1);

        when(kilometrageSummaryRepository
                .findByRobotIdAndSummaryDate("ROBOT-001", today))
                .thenReturn(Optional.empty());

        when(kilometrageSummaryRepository
                .findFirstByRobotIdOrderBySummaryDateDesc("ROBOT-001"))
                .thenReturn(Optional.empty());

        when(detectionEventRepository
                .countByEventDateAndStatutNot(
                        today,
                        DetectionEvent.StatutAnomalie.RESOLUE))
                .thenReturn(0L);

        when(missionEventRepository
                .findByEventDateOrderByEventDatetimeAsc(today))
                .thenReturn(List.of(

                        MissionEvent.builder()
                                .category(MissionEvent.EventCategory.BACK_HOME)
                                .info("start")
                                .eventDate(today)
                                .eventDatetime(today.atTime(5, 0))
                                .build()
                ));

        when(teleoperationEventRepository
                .findByEventDateOrderByEventDatetimeAsc(today))
                .thenReturn(List.of());

        when(obstacleProgressRepository
                .findByEventDateOrderByEventDatetimeAsc(today))
                .thenReturn(List.of());

        when(missionEventRepository
                .findByCategoryAndEventDateOrderByEventDatetimeAsc(
                        MissionEvent.EventCategory.DOCKING,
                        today))
                .thenReturn(List.of());

        when(missionEventRepository.findAll())
                .thenReturn(List.of());

        Map<String, Object> kpi =
                dashboardService.buildKpi(today);

        assertEquals("RETOUR_BASE", kpi.get("modeRobot"));
        assertEquals("RETOUR_BASE", kpi.get("statutMission"));
        assertEquals(true, kpi.get("retourBaseEnCours"));
        assertEquals(1L, kpi.get("retoursBase"));
    }
}
