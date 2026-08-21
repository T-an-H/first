package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.StudentTier;
import com.course.backend.mapper.StudentTierMapper;
import com.course.backend.service.StudentTierService;
import org.springframework.stereotype.Service;

@Service
public class StudentTierServiceImpl extends ServiceImpl<StudentTierMapper, StudentTier> implements StudentTierService {
}
