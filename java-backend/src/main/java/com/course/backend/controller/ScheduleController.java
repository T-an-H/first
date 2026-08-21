package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.Schedule;
import com.course.backend.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

/**
 * 排课数据接口
 */
@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    /**
     * GET /api/schedules  排课列表
     * 可选参数：courseId / teacher
     */
    @GetMapping
    public Result<List<Schedule>> listSchedules(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String teacher) {
        QueryWrapper<Schedule> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        if (StringUtils.hasText(teacher)) qw.eq("teacher", teacher);
        qw.orderByAsc("day");
        return Result.ok(scheduleService.list(qw));
    }

    /**
     * GET /api/schedules/{id}  排课详情
     */
    @GetMapping("/{id}")
    public Result<Schedule> getSchedule(@PathVariable String id) {
        return Result.ok(scheduleService.getById(id));
    }

    /**
     * POST /api/schedules  新建排课
     */
    @PostMapping
    public Result<Schedule> addSchedule(@RequestBody Schedule schedule) {
        if (!StringUtils.hasText(schedule.getId())) {
            schedule.setId("sch-" + System.currentTimeMillis());
        }
        scheduleService.save(schedule);
        return Result.ok(schedule);
    }

    /**
     * PUT /api/schedules/{id}  更新排课
     */
    @PutMapping("/{id}")
    public Result<Schedule> updateSchedule(@PathVariable String id, @RequestBody Schedule schedule) {
        schedule.setId(id);
        scheduleService.updateById(schedule);
        return Result.ok(scheduleService.getById(id));
    }

    /**
     * DELETE /api/schedules/{id}  删除排课
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteSchedule(@PathVariable String id) {
        scheduleService.removeById(id);
        return Result.ok();
    }

    /**
     * POST /api/schedules/bulk  批量新建排课（循环单条保存）
     * body: [ { courseId, title?, day?, class_name?, startDate?, endDate?, timeSlot?, room?, teacher?, mentor? }, ... ]
     */
    @PostMapping("/bulk")
    public Result<List<Schedule>> addSchedulesBulk(@RequestBody List<Schedule> schedules) {
        List<Schedule> saved = new ArrayList<>();
        long base = System.currentTimeMillis();
        for (int i = 0; i < schedules.size(); i++) {
            Schedule s = schedules.get(i);
            if (!StringUtils.hasText(s.getId())) {
                s.setId("sch-" + base + "-" + i);
            }
            scheduleService.save(s);
            saved.add(s);
        }
        return Result.ok(saved);
    }
}
