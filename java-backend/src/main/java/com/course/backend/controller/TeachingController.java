package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.CourseFile;
import com.course.backend.entity.Enrollment;
import com.course.backend.entity.Evaluation;
import com.course.backend.entity.GradeConfig;
import com.course.backend.entity.Student;
import com.course.backend.entity.StudentGroup;
import com.course.backend.service.CourseFileService;
import com.course.backend.service.EnrollmentService;
import com.course.backend.service.EvaluationService;
import com.course.backend.service.GradeConfigService;
import com.course.backend.service.StudentGroupService;
import com.course.backend.service.StudentService;
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
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 教学数据接口：选课 / 分组 / 课程资源 / 成绩配置 / 评价
 * 路径严格按约定：/api/teaching/...
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class TeachingController {

    private final EnrollmentService enrollmentService;
    private final StudentGroupService studentGroupService;
    private final CourseFileService courseFileService;
    private final GradeConfigService gradeConfigService;
    private final EvaluationService evaluationService;
    private final StudentService studentService;

    // ==================== 选课记录 ====================

    /**
     * GET /api/teaching/enrollments?courseId=xxx  教师选课列表
     * 可选参数：courseId / studentId
     */
    @GetMapping("/enrollments")
    public Result<List<Enrollment>> listEnrollments(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String studentId) {
        QueryWrapper<Enrollment> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        if (StringUtils.hasText(studentId)) qw.eq("student_id", studentId);
        qw.orderByDesc("created_at");
        return Result.ok(enrollmentService.list(qw));
    }

    /**
     * POST /api/teaching/enrollments  新增选课
     * body: { id?, studentId, courseId, scheduleId?, enrollDate?, progress?, status? }
     */
    @PostMapping("/enrollments")
    public Result<Enrollment> addEnrollment(@RequestBody Enrollment enrollment) {
        if (!StringUtils.hasText(enrollment.getId())) {
            enrollment.setId("enr-" + System.currentTimeMillis());
        }
        if (enrollment.getProgress() == null) enrollment.setProgress(0);
        if (!StringUtils.hasText(enrollment.getStatus())) enrollment.setStatus("enrolled");
        enrollmentService.save(enrollment);
        return Result.ok(enrollment);
    }

    /**
     * PUT /api/teaching/enrollments/{id}  更新选课（学习进度 progress 等）
     * body 只需传要修改的字段，如 { progress: 60 }
     */
    @PutMapping("/enrollments/{id}")
    public Result<Enrollment> updateEnrollment(@PathVariable String id, @RequestBody Enrollment enrollment) {
        enrollment.setId(id);
        enrollmentService.updateById(enrollment);
        return Result.ok(enrollmentService.getById(id));
    }

    /**
     * DELETE /api/teaching/enrollments/{id}  删除选课
     */
    @DeleteMapping("/enrollments/{id}")
    public Result<Void> deleteEnrollment(@PathVariable String id) {
        enrollmentService.removeById(id);
        return Result.ok();
    }

    /**
     * POST /api/teaching/enrollments/bulk  批量新增选课（循环单条保存）
     * body: [ { studentId, courseId, scheduleId?, enrollDate?, progress?, status? }, ... ]
     */
    @PostMapping("/enrollments/bulk")
    public Result<List<Enrollment>> addEnrollmentsBulk(@RequestBody List<Enrollment> enrollments) {
        List<Enrollment> saved = new ArrayList<>();
        long base = System.currentTimeMillis();
        for (int i = 0; i < enrollments.size(); i++) {
            Enrollment e = enrollments.get(i);
            if (!StringUtils.hasText(e.getId())) {
                e.setId("enr-" + base + "-" + i);
            }
            if (e.getProgress() == null) e.setProgress(0);
            if (!StringUtils.hasText(e.getStatus())) e.setStatus("enrolled");
            enrollmentService.save(e);
            saved.add(e);
        }
        return Result.ok(saved);
    }

    /**
     * GET /api/teaching/enrollments/students?courseId=xxx  课程下全部学生（复用 enrollment → student）
     * 用于替代 GET /courses/{id}/students
     */
    @GetMapping("/enrollments/students")
    public Result<List<Student>> listEnrollmentStudents(@RequestParam String courseId) {
        QueryWrapper<Enrollment> qw = new QueryWrapper<>();
        qw.eq("course_id", courseId);
        List<Enrollment> enrollments = enrollmentService.list(qw);
        List<String> studentIds = enrollments.stream()
                .map(Enrollment::getStudentId)
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());
        if (studentIds.isEmpty()) {
            return Result.ok(Collections.emptyList());
        }
        Map<String, Student> studentMap = studentService.listByIds(studentIds).stream()
                .collect(Collectors.toMap(Student::getId, s -> s));
        List<Student> students = studentIds.stream()
                .map(studentMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return Result.ok(students);
    }

    // ==================== 分组 ====================

    /**
     * GET /api/teaching/groups?courseId=xxx  分组列表
     */
    @GetMapping("/groups")
    public Result<List<StudentGroup>> listGroups(@RequestParam(required = false) String courseId) {
        QueryWrapper<StudentGroup> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        qw.orderByAsc("name");
        return Result.ok(studentGroupService.list(qw));
    }

    /**
     * GET /api/teaching/groups/{id}  分组详情
     */
    @GetMapping("/groups/{id}")
    public Result<StudentGroup> getGroup(@PathVariable String id) {
        return Result.ok(studentGroupService.getById(id));
    }

    /**
     * POST /api/teaching/groups  新建分组
     * body: { id?, courseId, name, memberIds: ["s1","s2"] }
     */
    @PostMapping("/groups")
    public Result<StudentGroup> addGroup(@RequestBody StudentGroup group) {
        if (!StringUtils.hasText(group.getId())) {
            group.setId("grp-" + System.currentTimeMillis());
        }
        studentGroupService.save(group);
        return Result.ok(group);
    }

    /**
     * PUT /api/teaching/groups/{id}  更新分组（组名 / 成员）
     */
    @PutMapping("/groups/{id}")
    public Result<StudentGroup> updateGroup(@PathVariable String id, @RequestBody StudentGroup group) {
        group.setId(id);
        studentGroupService.updateById(group);
        return Result.ok(studentGroupService.getById(id));
    }

    /**
     * DELETE /api/teaching/groups/{id}  删除分组
     */
    @DeleteMapping("/groups/{id}")
    public Result<Void> deleteGroup(@PathVariable String id) {
        studentGroupService.removeById(id);
        return Result.ok();
    }

    /**
     * POST /api/teaching/groups/bulk  批量新建分组（循环单条保存）
     * body: [ { courseId, name, memberIds? }, ... ]
     */
    @PostMapping("/groups/bulk")
    public Result<List<StudentGroup>> addGroupsBulk(@RequestBody List<StudentGroup> groups) {
        List<StudentGroup> saved = new ArrayList<>();
        long base = System.currentTimeMillis();
        for (int i = 0; i < groups.size(); i++) {
            StudentGroup g = groups.get(i);
            if (!StringUtils.hasText(g.getId())) {
                g.setId("grp-" + base + "-" + i);
            }
            studentGroupService.save(g);
            saved.add(g);
        }
        return Result.ok(saved);
    }

    // ==================== 课程资源 ====================

    /**
     * GET /api/teaching/files?courseId=xxx  课程资源列表
     */
    @GetMapping("/files")
    public Result<List<CourseFile>> listFiles(@RequestParam(required = false) String courseId) {
        QueryWrapper<CourseFile> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        qw.orderByDesc("created_at");
        return Result.ok(courseFileService.list(qw));
    }

    /**
     * POST /api/teaching/files  新增课程资源
     * body: { id?, courseId, name, size?, type?, dataUrl?, uploadedAt?, uploadedBy?, visibilityScope?, visibleToClassNames? }
     */
    @PostMapping("/files")
    public Result<CourseFile> addFile(@RequestBody CourseFile file) {
        if (!StringUtils.hasText(file.getId())) {
            file.setId("file-" + System.currentTimeMillis());
        }
        courseFileService.save(file);
        return Result.ok(file);
    }

    /**
     * DELETE /api/teaching/files/{id}  删除课程资源
     */
    @DeleteMapping("/files/{id}")
    public Result<Void> deleteFile(@PathVariable String id) {
        courseFileService.removeById(id);
        return Result.ok();
    }

    /**
     * PUT /api/teaching/files/{id}  更新课程资源（重命名/改可见范围等）
     * body 只需传要修改的字段，如 { name: "新文件名" }
     */
    @PutMapping("/files/{id}")
    public Result<CourseFile> updateFile(@PathVariable String id, @RequestBody CourseFile file) {
        file.setId(id);
        courseFileService.updateById(file);
        return Result.ok(courseFileService.getById(id));
    }

    // ==================== 成绩权重配置 ====================

    /**
     * GET /api/teaching/grade-config?courseId=xxx  获取成绩配置（未配置时返回默认值）
     */
    @GetMapping("/grade-config")
    public Result<GradeConfig> getGradeConfig(@RequestParam String courseId) {
        GradeConfig cfg = gradeConfigService.getById(courseId);
        if (cfg == null) {
            cfg = GradeConfig.defaultOf(courseId);
        }
        return Result.ok(cfg);
    }

    /**
     * POST /api/teaching/grade-config  保存成绩配置（不存在则新增，存在则更新）
     */
    @PostMapping("/grade-config")
    public Result<GradeConfig> saveGradeConfig(@RequestBody GradeConfig config) {
        gradeConfigService.saveOrUpdate(config);
        return Result.ok(gradeConfigService.getById(config.getCourseId()));
    }

    // ==================== 课程评价 ====================

    /**
     * GET /api/teaching/evaluations?courseId=xxx  课程评价列表
     * 可选参数：studentId / sessionNumber / type
     */
    @GetMapping("/evaluations")
    public Result<List<Evaluation>> listEvaluations(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) Integer sessionNumber,
            @RequestParam(required = false) String type) {
        QueryWrapper<Evaluation> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        if (StringUtils.hasText(studentId)) qw.eq("student_id", studentId);
        if (sessionNumber != null) qw.eq("session_number", sessionNumber);
        if (StringUtils.hasText(type)) qw.eq("type", type);
        qw.orderByAsc("session_number");
        return Result.ok(evaluationService.list(qw));
    }

    /**
     * POST /api/teaching/evaluations  新增评价记录（教师打分/学生自评等）
     */
    @PostMapping("/evaluations")
    public Result<Evaluation> addEvaluation(@RequestBody Evaluation evaluation) {
        if (!StringUtils.hasText(evaluation.getId())) {
            evaluation.setId("ev-" + System.currentTimeMillis());
        }
        evaluationService.save(evaluation);
        return Result.ok(evaluation);
    }

    /**
     * PUT /api/teaching/evaluations/{id}  修改评价记录（改分/改评语）
     */
    @PutMapping("/evaluations/{id}")
    public Result<Evaluation> updateEvaluation(@PathVariable String id, @RequestBody Evaluation evaluation) {
        evaluation.setId(id);
        evaluationService.updateById(evaluation);
        return Result.ok(evaluationService.getById(id));
    }

    /**
     * DELETE /api/teaching/evaluations/{id}  删除评价记录
     */
    @DeleteMapping("/evaluations/{id}")
    public Result<Void> deleteEvaluation(@PathVariable String id) {
        evaluationService.removeById(id);
        return Result.ok();
    }
}
