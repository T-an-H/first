package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.Student;
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

import java.util.List;

/**
 * 学生数据接口
 */
@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    /**
     * GET /api/students  学生列表
     * 可选参数：className（班级）/ keyword（姓名或学号模糊）
     */
    @GetMapping
    public Result<List<Student>> listStudents(
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String keyword) {
        QueryWrapper<Student> qw = new QueryWrapper<>();
        if (StringUtils.hasText(className)) qw.eq("class_name", className);
        if (StringUtils.hasText(keyword)) {
            qw.and(w -> w.like("name", keyword).or().like("student_id", keyword));
        }
        qw.orderByAsc("name");
        return Result.ok(studentService.list(qw));
    }

    /**
     * GET /api/students/classes  班级去重列表（前端 fetchClasses）
     */
    @GetMapping("/classes")
    public Result<List<String>> listClasses() {
        List<Student> students = studentService.list(
                new QueryWrapper<Student>().isNotNull("class_name").ne("class_name", ""));
        List<String> classes = students.stream()
                .map(Student::getClassName)
                .distinct()
                .sorted()
                .toList();
        return Result.ok(classes);
    }

    /**
     * GET /api/students/{id}  学生详情
     */
    @GetMapping("/{id}")
    public Result<Student> getStudent(@PathVariable String id) {
        return Result.ok(studentService.getById(id));
    }

    /**
     * POST /api/students  新增学生
     */
    @PostMapping
    public Result<Student> addStudent(@RequestBody Student student) {
        if (!StringUtils.hasText(student.getId())) {
            student.setId("stu-" + System.currentTimeMillis());
        }
        if (!StringUtils.hasText(student.getStatus())) student.setStatus("active");
        studentService.save(student);
        return Result.ok(student);
    }

    /**
     * PUT /api/students/{id}  更新学生
     */
    @PutMapping("/{id}")
    public Result<Student> updateStudent(@PathVariable String id, @RequestBody Student student) {
        student.setId(id);
        studentService.updateById(student);
        return Result.ok(studentService.getById(id));
    }

    /**
     * DELETE /api/students/{id}  删除学生
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteStudent(@PathVariable String id) {
        studentService.removeById(id);
        return Result.ok();
    }
}
