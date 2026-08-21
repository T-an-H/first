package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.Category;
import com.course.backend.entity.Department;
import com.course.backend.entity.DepartmentClass;
import com.course.backend.entity.Leader;
import com.course.backend.entity.Mentor;
import com.course.backend.entity.Teacher;
import com.course.backend.service.CategoryService;
import com.course.backend.service.DepartmentClassService;
import com.course.backend.service.DepartmentService;
import com.course.backend.service.LeaderService;
import com.course.backend.service.MentorService;
import com.course.backend.service.TeacherService;
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
 * 基础数据聚合接口（分类/学院/班级/教师/导师/领导）
 */
@RestController
@RequestMapping("/api/base-data")
@RequiredArgsConstructor
public class BaseDataController {

    private final CategoryService categoryService;
    private final DepartmentService departmentService;
    private final DepartmentClassService departmentClassService;
    private final TeacherService teacherService;
    private final MentorService mentorService;
    private final LeaderService leaderService;

    // ---------- 分类 Category ----------

    /**
     * GET /api/base-data/categories  分类列表
     * 可选参数：departmentId
     */
    @GetMapping("/categories")
    public Result<List<Category>> listCategories(
            @RequestParam(required = false) String departmentId) {
        QueryWrapper<Category> qw = new QueryWrapper<>();
        if (StringUtils.hasText(departmentId)) qw.eq("department_id", departmentId);
        return Result.ok(categoryService.list(qw));
    }

    /**
     * POST /api/base-data/categories  新增分类
     */
    @PostMapping("/categories")
    public Result<Category> addCategory(@RequestBody Category category) {
        if (!StringUtils.hasText(category.getId())) {
            category.setId("cat-" + System.currentTimeMillis());
        }
        categoryService.save(category);
        return Result.ok(category);
    }

    /**
     * PUT /api/base-data/categories/{id}  更新分类
     */
    @PutMapping("/categories/{id}")
    public Result<Category> updateCategory(@PathVariable String id, @RequestBody Category category) {
        category.setId(id);
        categoryService.updateById(category);
        return Result.ok(categoryService.getById(id));
    }

    /**
     * DELETE /api/base-data/categories/{id}  删除分类
     */
    @DeleteMapping("/categories/{id}")
    public Result<Void> deleteCategory(@PathVariable String id) {
        categoryService.removeById(id);
        return Result.ok();
    }

    // ---------- 学院 Department ----------

    /**
     * GET /api/base-data/departments  学院列表
     */
    @GetMapping("/departments")
    public Result<List<Department>> listDepartments() {
        return Result.ok(departmentService.list());
    }

    /**
     * POST /api/base-data/departments  新增学院
     */
    @PostMapping("/departments")
    public Result<Department> addDepartment(@RequestBody Department department) {
        if (!StringUtils.hasText(department.getId())) {
            department.setId("dept-" + System.currentTimeMillis());
        }
        departmentService.save(department);
        return Result.ok(department);
    }

    /**
     * PUT /api/base-data/departments/{id}  更新学院
     */
    @PutMapping("/departments/{id}")
    public Result<Department> updateDepartment(@PathVariable String id, @RequestBody Department department) {
        department.setId(id);
        departmentService.updateById(department);
        return Result.ok(departmentService.getById(id));
    }

    /**
     * DELETE /api/base-data/departments/{id}  删除学院
     */
    @DeleteMapping("/departments/{id}")
    public Result<Void> deleteDepartment(@PathVariable String id) {
        departmentService.removeById(id);
        return Result.ok();
    }

    // ---------- 班级 DepartmentClass ----------

    /**
     * GET /api/base-data/department-classes  班级列表
     * 可选参数：departmentId
     */
    @GetMapping("/department-classes")
    public Result<List<DepartmentClass>> listDepartmentClasses(
            @RequestParam(required = false) String departmentId) {
        QueryWrapper<DepartmentClass> qw = new QueryWrapper<>();
        if (StringUtils.hasText(departmentId)) qw.eq("department_id", departmentId);
        return Result.ok(departmentClassService.list(qw));
    }

    /**
     * POST /api/base-data/department-classes  新增班级
     */
    @PostMapping("/department-classes")
    public Result<DepartmentClass> addDepartmentClass(@RequestBody DepartmentClass departmentClass) {
        if (!StringUtils.hasText(departmentClass.getId())) {
            departmentClass.setId("class-" + System.currentTimeMillis());
        }
        // department_id 为 NOT NULL 且无默认值，未指定学院时兜底为空串，避免插入失败
        if (!StringUtils.hasText(departmentClass.getDepartmentId())) {
            departmentClass.setDepartmentId("");
        }
        departmentClassService.save(departmentClass);
        return Result.ok(departmentClass);
    }

    /**
     * PUT /api/base-data/department-classes/{id}  更新班级
     */
    @PutMapping("/department-classes/{id}")
    public Result<DepartmentClass> updateDepartmentClass(@PathVariable String id, @RequestBody DepartmentClass departmentClass) {
        departmentClass.setId(id);
        departmentClassService.updateById(departmentClass);
        return Result.ok(departmentClassService.getById(id));
    }

    /**
     * DELETE /api/base-data/department-classes/{id}  删除班级
     */
    @DeleteMapping("/department-classes/{id}")
    public Result<Void> deleteDepartmentClass(@PathVariable String id) {
        departmentClassService.removeById(id);
        return Result.ok();
    }

    // ---------- 教师 Teacher ----------

    /**
     * GET /api/base-data/teachers  教师列表
     */
    @GetMapping("/teachers")
    public Result<List<Teacher>> listTeachers() {
        return Result.ok(teacherService.list());
    }

    /**
     * POST /api/base-data/teachers  新增教师
     */
    @PostMapping("/teachers")
    public Result<Teacher> addTeacher(@RequestBody Teacher teacher) {
        if (!StringUtils.hasText(teacher.getId())) {
            teacher.setId("teacher-" + System.currentTimeMillis());
        }
        teacherService.save(teacher);
        return Result.ok(teacher);
    }

    /**
     * PUT /api/base-data/teachers/{id}  更新教师
     */
    @PutMapping("/teachers/{id}")
    public Result<Teacher> updateTeacher(@PathVariable String id, @RequestBody Teacher teacher) {
        teacher.setId(id);
        teacherService.updateById(teacher);
        return Result.ok(teacherService.getById(id));
    }

    /**
     * DELETE /api/base-data/teachers/{id}  删除教师
     */
    @DeleteMapping("/teachers/{id}")
    public Result<Void> deleteTeacher(@PathVariable String id) {
        teacherService.removeById(id);
        return Result.ok();
    }

    // ---------- 导师 Mentor ----------

    /**
     * GET /api/base-data/mentors  导师列表
     */
    @GetMapping("/mentors")
    public Result<List<Mentor>> listMentors() {
        return Result.ok(mentorService.list());
    }

    /**
     * POST /api/base-data/mentors  新增导师
     */
    @PostMapping("/mentors")
    public Result<Mentor> addMentor(@RequestBody Mentor mentor) {
        if (!StringUtils.hasText(mentor.getId())) {
            mentor.setId("mentor-" + System.currentTimeMillis());
        }
        mentorService.save(mentor);
        return Result.ok(mentor);
    }

    /**
     * PUT /api/base-data/mentors/{id}  更新导师
     */
    @PutMapping("/mentors/{id}")
    public Result<Mentor> updateMentor(@PathVariable String id, @RequestBody Mentor mentor) {
        mentor.setId(id);
        mentorService.updateById(mentor);
        return Result.ok(mentorService.getById(id));
    }

    /**
     * DELETE /api/base-data/mentors/{id}  删除导师
     */
    @DeleteMapping("/mentors/{id}")
    public Result<Void> deleteMentor(@PathVariable String id) {
        mentorService.removeById(id);
        return Result.ok();
    }

    // ---------- 领导 Leader ----------

    /**
     * GET /api/base-data/leaders  领导列表
     */
    @GetMapping("/leaders")
    public Result<List<Leader>> listLeaders() {
        return Result.ok(leaderService.list());
    }

    /**
     * POST /api/base-data/leaders  新增领导
     */
    @PostMapping("/leaders")
    public Result<Leader> addLeader(@RequestBody Leader leader) {
        if (!StringUtils.hasText(leader.getId())) {
            leader.setId("leader-" + System.currentTimeMillis());
        }
        leaderService.save(leader);
        return Result.ok(leader);
    }

    /**
     * PUT /api/base-data/leaders/{id}  更新领导
     */
    @PutMapping("/leaders/{id}")
    public Result<Leader> updateLeader(@PathVariable String id, @RequestBody Leader leader) {
        leader.setId(id);
        leaderService.updateById(leader);
        return Result.ok(leaderService.getById(id));
    }

    /**
     * DELETE /api/base-data/leaders/{id}  删除领导
     */
    @DeleteMapping("/leaders/{id}")
    public Result<Void> deleteLeader(@PathVariable String id) {
        leaderService.removeById(id);
        return Result.ok();
    }
}
