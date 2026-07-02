package com.workflow_automation.workflow_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.queue}")
    private String queueName;

    @Value("${app.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.routingkey}")
    private String routingKey;

    @Bean
    public Queue workflowExecutionQueue() {
        return new Queue(queueName, true);
    }

    @Bean
    public TopicExchange workflowExecutionExchange() {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public Binding workflowExecutionBinding(Queue workflowExecutionQueue, TopicExchange workflowExecutionExchange) {
        return BindingBuilder.bind(workflowExecutionQueue).to(workflowExecutionExchange).with(routingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public TopicExchange auditExchange() {
        return new TopicExchange("audit.exchange");
    }

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange("notification.exchange");
    }
}
