package com.terrarosa.terra_crm.modules.health.service;

import com.terrarosa.terra_crm.modules.health.dto.*;
import com.terrarosa.terra_crm.modules.health.entity.*;
import com.terrarosa.terra_crm.modules.health.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerParametersService {

    private final CategoryRepository categoryRepository;
    private final ServiceEntityRepository serviceRepository;
    private final StatusRepository statusRepository;
    private final SourceRepository sourceRepository;
    private final TagRepository tagRepository;
    private final FileCategoryRepository fileCategoryRepository;

    // ==================== CATEGORIES ====================

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::convertCategoryToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return convertCategoryToDto(category);
    }

    @Transactional
    public CategoryDto createCategory(ParameterRequest request) {
        Category category = Category.builder()
                .labelTr(request.getLabelTr())
                .labelEn(request.getLabelEn())
                .color(request.getColor())
                .icon(request.getIcon())
                .isSystem(false)
                .build();

        Category saved = categoryRepository.save(category);
        log.info("Created new category: {}", saved.getLabelEn());
        return convertCategoryToDto(saved);
    }

    @Transactional
    public CategoryDto updateCategory(UUID id, ParameterRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        if (Boolean.TRUE.equals(category.getIsSystem())) {
            throw new RuntimeException("Cannot update system category");
        }

        category.setLabelTr(request.getLabelTr());
        category.setLabelEn(request.getLabelEn());
        category.setColor(request.getColor());
        category.setIcon(request.getIcon());

        Category updated = categoryRepository.save(category);
        log.info("Updated category: {}", updated.getLabelEn());
        return convertCategoryToDto(updated);
    }

    @Transactional
    public void deleteCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        if (Boolean.TRUE.equals(category.getIsSystem())) {
            throw new RuntimeException("Cannot delete system category");
        }

        // Check if any services are using this category
        List<ServiceEntity> services = serviceRepository.findByCategoryId(id);
        if (!services.isEmpty()) {
            throw new RuntimeException("Cannot delete category that has services associated with it");
        }

        categoryRepository.deleteById(id);
        log.info("Deleted category: {}", category.getLabelEn());
    }

    // ==================== SERVICES ====================

    @Transactional(readOnly = true)
    public List<ServiceDto> getAllServices() {
        return serviceRepository.findAll().stream()
                .map(this::convertServiceToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServiceDto getServiceById(UUID id) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));
        return convertServiceToDto(service);
    }

    @Transactional
    public ServiceDto createService(ServiceRequest request) {
        // Validate category exists
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.getCategoryId()));

        ServiceEntity service = ServiceEntity.builder()
                .nameTr(request.getNameTr())
                .nameEn(request.getNameEn())
                .value(request.getValue())
                .categoryId(request.getCategoryId())
                .color(request.getColor())
                .icon(request.getIcon())
                .isSystem(false)
                .build();

        ServiceEntity saved = serviceRepository.save(service);
        log.info("Created new service: {} in category: {}", saved.getNameEn(), category.getLabelEn());
        return convertServiceToDto(saved);
    }

    @Transactional
    public ServiceDto updateService(UUID id, ServiceRequest request) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        if (Boolean.TRUE.equals(service.getIsSystem())) {
            throw new RuntimeException("Cannot update system service");
        }

        // Validate category exists
        categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.getCategoryId()));

        service.setNameTr(request.getNameTr());
        service.setNameEn(request.getNameEn());
        service.setValue(request.getValue());
        service.setCategoryId(request.getCategoryId());
        service.setColor(request.getColor());
        service.setIcon(request.getIcon());

        ServiceEntity updated = serviceRepository.save(service);
        log.info("Updated service: {}", updated.getNameEn());
        return convertServiceToDto(updated);
    }

    @Transactional
    public void deleteService(UUID id) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        if (Boolean.TRUE.equals(service.getIsSystem())) {
            throw new RuntimeException("Cannot delete system service");
        }

        serviceRepository.deleteById(id);
        log.info("Deleted service: {}", service.getNameEn());
    }

    // ==================== STATUSES ====================

    @Transactional(readOnly = true)
    public List<StatusDto> getAllStatuses() {
        return statusRepository.findAll().stream()
                .map(this::convertStatusToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StatusDto getStatusById(UUID id) {
        Status status = statusRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Status not found with id: " + id));
        return convertStatusToDto(status);
    }

    @Transactional
    public StatusDto createStatus(ParameterRequest request) {
        Status status = Status.builder()
                .labelTr(request.getLabelTr())
                .labelEn(request.getLabelEn())
                .value(request.getValue())
                .color(request.getColor())
                .icon(request.getIcon())
                .isSystem(false)
                .build();

        Status saved = statusRepository.save(status);
        log.info("Created new status: {}", saved.getLabelEn());
        return convertStatusToDto(saved);
    }

    @Transactional
    public StatusDto updateStatus(UUID id, ParameterRequest request) {
        Status status = statusRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Status not found with id: " + id));

        if (Boolean.TRUE.equals(status.getIsSystem())) {
            throw new RuntimeException("Cannot update system status");
        }

        status.setLabelTr(request.getLabelTr());
        status.setLabelEn(request.getLabelEn());
        status.setValue(request.getValue());
        status.setColor(request.getColor());
        status.setIcon(request.getIcon());

        Status updated = statusRepository.save(status);
        log.info("Updated status: {}", updated.getLabelEn());
        return convertStatusToDto(updated);
    }

    @Transactional
    public void deleteStatus(UUID id) {
        Status status = statusRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Status not found with id: " + id));

        if (Boolean.TRUE.equals(status.getIsSystem())) {
            throw new RuntimeException("Cannot delete system status");
        }

        statusRepository.deleteById(id);
        log.info("Deleted status: {}", status.getLabelEn());
    }

    // ==================== SOURCES ====================

    @Transactional(readOnly = true)
    public List<SourceDto> getAllSources() {
        return sourceRepository.findAll().stream()
                .map(this::convertSourceToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SourceDto getSourceById(UUID id) {
        Source source = sourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Source not found with id: " + id));
        return convertSourceToDto(source);
    }

    @Transactional
    public SourceDto createSource(ParameterRequest request) {
        Source source = Source.builder()
                .labelTr(request.getLabelTr())
                .labelEn(request.getLabelEn())
                .value(request.getValue())
                .color(request.getColor())
                .icon(request.getIcon())
                .isSystem(false)
                .build();

        Source saved = sourceRepository.save(source);
        log.info("Created new source: {}", saved.getLabelEn());
        return convertSourceToDto(saved);
    }

    @Transactional
    public SourceDto updateSource(UUID id, ParameterRequest request) {
        Source source = sourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Source not found with id: " + id));

        if (Boolean.TRUE.equals(source.getIsSystem())) {
            throw new RuntimeException("Cannot update system source");
        }

        source.setLabelTr(request.getLabelTr());
        source.setLabelEn(request.getLabelEn());
        source.setValue(request.getValue());
        source.setColor(request.getColor());
        source.setIcon(request.getIcon());

        Source updated = sourceRepository.save(source);
        log.info("Updated source: {}", updated.getLabelEn());
        return convertSourceToDto(updated);
    }

    @Transactional
    public void deleteSource(UUID id) {
        Source source = sourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Source not found with id: " + id));

        if (Boolean.TRUE.equals(source.getIsSystem())) {
            throw new RuntimeException("Cannot delete system source");
        }

        sourceRepository.deleteById(id);
        log.info("Deleted source: {}", source.getLabelEn());
    }

    // ==================== TAGS ====================

    @Transactional(readOnly = true)
    public List<TagDto> getAllTags() {
        return tagRepository.findAll().stream()
                .map(this::convertTagToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TagDto getTagById(UUID id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));
        return convertTagToDto(tag);
    }

    @Transactional
    public TagDto createTag(ParameterRequest request) {
        Tag tag = Tag.builder()
                .labelTr(request.getLabelTr())
                .labelEn(request.getLabelEn())
                .value(request.getValue())
                .color(request.getColor())
                .icon(request.getIcon())
                .isSystem(false)
                .build();

        Tag saved = tagRepository.save(tag);
        log.info("Created new tag: {}", saved.getLabelEn());
        return convertTagToDto(saved);
    }

    @Transactional
    public TagDto updateTag(UUID id, ParameterRequest request) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));

        if (Boolean.TRUE.equals(tag.getIsSystem())) {
            throw new RuntimeException("Cannot update system tag");
        }

        tag.setLabelTr(request.getLabelTr());
        tag.setLabelEn(request.getLabelEn());
        tag.setValue(request.getValue());
        tag.setColor(request.getColor());
        tag.setIcon(request.getIcon());

        Tag updated = tagRepository.save(tag);
        log.info("Updated tag: {}", updated.getLabelEn());
        return convertTagToDto(updated);
    }

    @Transactional
    public void deleteTag(UUID id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));

        if (Boolean.TRUE.equals(tag.getIsSystem())) {
            throw new RuntimeException("Cannot delete system tag");
        }

        tagRepository.deleteById(id);
        log.info("Deleted tag: {}", tag.getLabelEn());
    }

    // ==================== FILE CATEGORIES ====================

    @Transactional(readOnly = true)
    public List<FileCategoryDto> getAllFileCategories() {
        return fileCategoryRepository.findAll().stream()
                .map(this::convertFileCategoryToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FileCategoryDto getFileCategoryById(UUID id) {
        FileCategory fileCategory = fileCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File category not found with id: " + id));
        return convertFileCategoryToDto(fileCategory);
    }

    @Transactional
    public FileCategoryDto createFileCategory(ParameterRequest request) {
        FileCategory fileCategory = FileCategory.builder()
                .labelTr(request.getLabelTr())
                .labelEn(request.getLabelEn())
                .color(request.getColor())
                .icon(request.getIcon())
                .isSystem(false)
                .build();

        FileCategory saved = fileCategoryRepository.save(fileCategory);
        log.info("Created new file category: {}", saved.getLabelEn());
        return convertFileCategoryToDto(saved);
    }

    @Transactional
    public FileCategoryDto updateFileCategory(UUID id, ParameterRequest request) {
        FileCategory fileCategory = fileCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File category not found with id: " + id));

        if (Boolean.TRUE.equals(fileCategory.getIsSystem())) {
            throw new RuntimeException("Cannot update system file category");
        }

        fileCategory.setLabelTr(request.getLabelTr());
        fileCategory.setLabelEn(request.getLabelEn());
        fileCategory.setColor(request.getColor());
        fileCategory.setIcon(request.getIcon());

        FileCategory updated = fileCategoryRepository.save(fileCategory);
        log.info("Updated file category: {}", updated.getLabelEn());
        return convertFileCategoryToDto(updated);
    }

    @Transactional
    public void deleteFileCategory(UUID id) {
        FileCategory fileCategory = fileCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File category not found with id: " + id));

        if (Boolean.TRUE.equals(fileCategory.getIsSystem())) {
            throw new RuntimeException("Cannot delete system file category");
        }

        fileCategoryRepository.deleteById(id);
        log.info("Deleted file category: {}", fileCategory.getLabelEn());
    }

    // ==================== CONVERTERS ====================

    private CategoryDto convertCategoryToDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .labelTr(category.getLabelTr())
                .labelEn(category.getLabelEn())
                .color(category.getColor())
                .icon(category.getIcon())
                .isSystem(category.getIsSystem())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private ServiceDto convertServiceToDto(ServiceEntity service) {
        ServiceDto.ServiceDtoBuilder builder = ServiceDto.builder()
                .id(service.getId())
                .nameTr(service.getNameTr())
                .nameEn(service.getNameEn())
                .value(service.getValue())
                .categoryId(service.getCategoryId())
                .color(service.getColor())
                .icon(service.getIcon())
                .isSystem(service.getIsSystem())
                .createdAt(service.getCreatedAt())
                .updatedAt(service.getUpdatedAt());

        // Add category labels if available
        if (service.getCategory() != null) {
            builder.categoryLabelTr(service.getCategory().getLabelTr())
                    .categoryLabelEn(service.getCategory().getLabelEn());
        } else {
            // Fetch category separately if not loaded
            categoryRepository.findById(service.getCategoryId()).ifPresent(cat -> {
                builder.categoryLabelTr(cat.getLabelTr())
                        .categoryLabelEn(cat.getLabelEn());
            });
        }

        return builder.build();
    }

    private StatusDto convertStatusToDto(Status status) {
        return StatusDto.builder()
                .id(status.getId())
                .labelTr(status.getLabelTr())
                .labelEn(status.getLabelEn())
                .value(status.getValue())
                .color(status.getColor())
                .icon(status.getIcon())
                .isSystem(status.getIsSystem())
                .createdAt(status.getCreatedAt())
                .updatedAt(status.getUpdatedAt())
                .build();
    }

    private SourceDto convertSourceToDto(Source source) {
        return SourceDto.builder()
                .id(source.getId())
                .labelTr(source.getLabelTr())
                .labelEn(source.getLabelEn())
                .value(source.getValue())
                .color(source.getColor())
                .icon(source.getIcon())
                .isSystem(source.getIsSystem())
                .createdAt(source.getCreatedAt())
                .updatedAt(source.getUpdatedAt())
                .build();
    }

    private TagDto convertTagToDto(Tag tag) {
        return TagDto.builder()
                .id(tag.getId())
                .labelTr(tag.getLabelTr())
                .labelEn(tag.getLabelEn())
                .value(tag.getValue())
                .color(tag.getColor())
                .icon(tag.getIcon())
                .isSystem(tag.getIsSystem())
                .createdAt(tag.getCreatedAt())
                .updatedAt(tag.getUpdatedAt())
                .build();
    }

    private FileCategoryDto convertFileCategoryToDto(FileCategory fileCategory) {
        return FileCategoryDto.builder()
                .id(fileCategory.getId())
                .labelTr(fileCategory.getLabelTr())
                .labelEn(fileCategory.getLabelEn())
                .color(fileCategory.getColor())
                .icon(fileCategory.getIcon())
                .isSystem(fileCategory.getIsSystem())
                .createdAt(fileCategory.getCreatedAt())
                .updatedAt(fileCategory.getUpdatedAt())
                .build();
    }
}
