package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.OnlineDoc;
import com.course.backend.mapper.OnlineDocMapper;
import com.course.backend.service.OnlineDocService;
import org.springframework.stereotype.Service;

@Service
public class OnlineDocServiceImpl extends ServiceImpl<OnlineDocMapper, OnlineDoc> implements OnlineDocService {
}
