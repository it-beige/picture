<template>
  <div class="jl-upload-box">
    <el-checkbox-group v-model="fileList" />
    <el-upload
      ref="elUpload"
      class="upload"
      :class="{'upload-disabled': bindAttrs.disabled, 'upload-exceed' : isExceed}"
      v-bind="bindAttrs"
      v-on="onEvents"
      :action="getUploadUrl(bindAttrs.url || bindAttrs.action)"
      :show-file-list="listType === ['picture-card', 'card']"
      :file-list="fileList"
      :list-type="listType === 'card' ? 'picture-card' : listType"
      :headers="uploadHeaders"
      :auto-upload="autoUpload"
      :on-change="handleChange"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :on-progress="handleProgress"
      :before-remove="beforeRemove"
    >
      <template v-if="!this.isExceed">
        <el-button
          size="small"
          type="default"
          icon="el-icon-upload2"
          v-if="listType === 'text'"
        >点击上传</el-button>
        <i
          slot="trigger"
          class="el-icon-plus"
          v-if="listType === 'card'"
        ></i>
      </template>
      <div
        class="file__card"
        slot="file"
        slot-scope="{file}"
        v-if="listType === 'picture-card'"
      >
        <el-image
          v-if="isAssetTypeAnImage(file)"
          style="width: 100%; height: 100%;"
          :src="getPreviewUrl(file)"
          :preview-src-list="[getPreviewUrl(file)]"
          fit="cover"
        />
        <div
          class="file-scope__icon"
          v-else
          @click.stop="handlePreview(file)"
        >
          <i class="el-icon-paperclip" />
        </div>
        <span
          v-if="!bindAttrs.disabled"
          class="file-list__item-delete"
          @click.stop="removeFile(file)"
        >
          <i class="el-icon-error del-btn__icon"></i>
        </span>
      </div>
    </el-upload>
    <template v-if="listType === 'text'">
      <div
        class="file-list"
        v-for="(item,index) of fileList"
        :key="index"
      >
        <el-link
          @click="handlePreview(item)"
          target="_blank"
        >
          {{ item.name }}
        </el-link>
        <i
          class="el-icon-error del-btn__icon"
          @click="removeFile(item)"
          v-if="!bindAttrs.disabled"
        />
      </div>
      <div
        class="progress-box"
        v-show="currentFileName"
      >
        <div>
          {{ currentFileName }}
        </div>
        <div>
          <el-progress
            :percentage="progress"
            :color="customColors"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import UploadMixins from '../../mixins/UploadMixins'

export default {
  name: "DynamicUpload",
  componentName: 'DynamicUpload',
  inheritAttrs: false,
  mixins: [UploadMixins],
  props: {
    autoUpload: {
      type: Boolean,
      default: true
    },
    // 获取文件预览的url
    previewUrl: Function,
    // 附件列表展示模式
    listType: {
      type: String,
      default: 'text',
      validator(val) {
        if (['text', 'picture', 'picture-card'].includes(val)) {
          return true
        } else {
          throw new Error(`【listType】可选值为【text, picture, picture-card, ${val}】与预期值不符`)
        }
      }
    },
    // 标识字段
    keyField: {
      type: String,
      default: 'id'
    }
  },
  data() {
    return {
      fileList: [],
      progress: 0, // 上传进度
      currentFileName: null, // 上传文件名称
      // 进度条颜色
      customColors: [
        { color: '#f56c6c', percentage: 20 },
        { color: '#e6a23c', percentage: 40 },
        { color: '#5cb87a', percentage: 60 },
        { color: '#1989fa', percentage: 80 },
        { color: '#6f7ad3', percentage: 100 }
      ]
    }
  },
  computed: {
    // 超出限制数量
    isExceed() {
      if (!this.bindAttrs.limit) {
        return false
      }
      return this.bindAttrs.limit <= this.fileList.length
    }
  },
  watch: {
    fileList: {
      handler(val) {
        this.$emit('input', val);
        this.$emit('change', val)
      },
      deep: true
    },
    value: {
      handler(val) {
        this.fileList = val || []
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    // 上传附件
    submit() {
      this.$refs.elUpload.submit();
    },
    // 取消上传
    abort() {
      this.$refs.elUpload.abort();
    },
    // 清空文件
    clearFiles() {
      this.$refs.elUpload.clearFiles();
    },
    handleRemove(file) {
      let fileId = file[this.keyField];
      if (!fileId && file.response) {
        fileId = file.response.data;
        if (file.response.data[this.keyField]) {
          fileId = file.response.data[this.keyField]
        }
      } else if (!fileId) {
        fileId = file.uid
      }
      const index = this.fileList.findIndex(i => i[this.keyField] === fileId || i.uid === fileId);
      if (index !== -1) {
        this.fileList.splice(index, 1)
      }
    },
    removeFile(file) {
      this.beforeRemove(file).then(() => {
        this.handleRemove(file)
      })
    },
    handleChange(file, fileList) {
      if (this.bindAttrs.onChange) {
        this.bindAttrs.onChange(file, fileList, this)
      }
    },
    handlePreview(file) {
      if (this.bindAttrs.onPreview) {
        this.bindAttrs.onPreview(file);
        return
      }
      window.open(this.getPreviewUrl(file), '_blank')
    },
    // 默认预览方法
    getPreviewUrl(file) {
      if (this.previewUrl && typeof this.previewUrl === 'function') {
        return this.previewUrl(file)
      } else if (file.url) {
        return file.url
      } else if (file.raw) {
        return window.URL.createObjectURL(new Blob([file.raw]))
      } else {
        return ''
      }
    },
    beforeRemove(file) {
      if (this.bindAttrs.beforeRemove) {
        return this.bindAttrs.beforeRemove(file)
      }
      return this.$confirm(`确定移除 ${file.name}？`);
    },
    handleSuccess(response, file, fileList) {
      if (this.bindAttrs.onSuccess) {
        this.bindAttrs.onSuccess(response, file, fileList, this);
        this.currentFileName = null;
        this.progress = 0;
        return
      }
      this.progress = 100;
      let fileInfo = response.data || response;
      if (this.parseData && typeof this.parseData === 'function') {
        fileInfo = this.parseData(response)
      }
      const index = this.fileList.findIndex(i => i[this.keyField] === fileInfo[this.keyField]);
      if (index === -1) {
        this.fileList.push(fileInfo)
      }
      this.currentFileName = null;
      this.progress = 0
    },
    handleError() {
      this.currentFileName = null;
      this.progress = 0;
      if (this.bindAttrs.onError) {
        this.bindAttrs.onError(this);
        return
      }
      this.$message.error("文件上传失败")
    },
    handleProgress(event, file, fileList) {
      if (this.bindAttrs.onProgress) {
        this.bindAttrs.onProgress(event, file, fileList, this);
        return
      }
      if (this.progress === 0) {
        this.currentFileName = file && file.name
      }
      let progress = event.percent.toFixed(1);
      if (progress >= 99.9) {
        progress = 99.9
      }
      this.progress = parseFloat(progress)
    },
    isAssetTypeAnImage({ name, src, type }) {
      if (type && type.startsWith('image')) {
        return true
      }
      let ext;
      if (name) {
        const index = name.lastIndexOf('.');
        ext = name.substr(index + 1);
      } else if (src) {
        const index = src.lastIndexOf('.');
        if (index !== -1) {
          ext = src.substr(index + 1);
        }
      }
      if (!ext) {
        return false
      }
      return ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff', 'heic'].indexOf(ext.toLowerCase()) !== -1;
    },
  },
}
</script>
