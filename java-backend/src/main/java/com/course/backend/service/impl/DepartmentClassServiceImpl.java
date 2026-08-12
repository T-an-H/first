package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.DepartmentClass;
import com.course.backend.mapper.DepartmentClassMapper;
import com.course.backend.service.DepartmentClassService;
import org.springframework.stereotype.Service;

@Service
public class DepartmentClassServiceImpl extends ServiceImpl<DepartmentClassMapper, DepartmentClass> implements DepartmentClassService {
}
