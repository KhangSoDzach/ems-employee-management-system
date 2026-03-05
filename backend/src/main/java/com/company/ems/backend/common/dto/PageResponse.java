package com.company.ems.backend.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> content;
    private int  page;
    private int  size;
    private long totalElements;
    private int  totalPages;
    private String displayInfo;
    public static <T> PageResponse<T> of(Page<T> springPage) {
        return of(springPage, "kết quả");
    }

    public static <T> PageResponse<T> of(Page<T> springPage, String entityName) {
        int  page       = springPage.getNumber();
        int  size       = springPage.getSize();
        long total      = springPage.getTotalElements();
        int  totalPages = springPage.getTotalPages();

        int from = total == 0 ? 0 : page * size + 1;
        int to   = (int) Math.min((long)(page + 1) * size, total);
        String info = String.format("Hiển thị %d-%d trên %d %s", from, to, total, entityName);

        return PageResponse.<T>builder()
                .content(springPage.getContent())
                .page(page)
                .size(size)
                .totalElements(total)
                .totalPages(totalPages)
                .displayInfo(info)
                .build();
    }

    public static <T> PageResponse<T> of(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages,
            String entityName) {

        int from = totalElements == 0 ? 0 : page * size + 1;
        int to   = (int) Math.min((long)(page + 1) * size, totalElements);
        String info = String.format("Hiển thị %d-%d trên %d %s", from, to, totalElements, entityName);

        return PageResponse.<T>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .displayInfo(info)
                .build();
    }
}