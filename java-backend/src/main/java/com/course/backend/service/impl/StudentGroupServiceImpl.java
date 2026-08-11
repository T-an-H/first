package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.StudentGroup;
import com.course.backend.mapper.StudentGroupMapper;
import com.course.backend.service.StudentGroupService;
import org.springframework.stereotype.Service;

@Service
public class StudentGroupServiceImpl extends ServiceImpl<StudentGroupMapper, StudentGroup> implements StudentGroupService {
}
